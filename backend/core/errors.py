import logging
import uuid
from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("backend.errors")


class ProblemException(Exception):
    def __init__(
        self,
        status_code: int,
        title: str,
        detail: str,
        problem_type: str = "https://globaltolocal.in/problems/error",
        errors: Optional[list[dict[str, Any]]] = None,
        headers: Optional[dict[str, str]] = None,
    ):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.problem_type = problem_type
        self.errors = errors or []
        self.headers = headers or {}
        super().__init__(detail)


def build_problem_response(
    request: Request,
    status_code: int,
    title: str,
    detail: str,
    problem_type: str = "https://globaltolocal.in/problems/error",
    errors: Optional[list[dict[str, Any]]] = None,
    headers: Optional[dict[str, str]] = None,
) -> JSONResponse:
    trace_id = getattr(request.state, "trace_id", f"req_{uuid.uuid4().hex[:12]}")
    payload: dict[str, Any] = {
        "type": problem_type,
        "title": title,
        "status": status_code,
        "detail": detail,
        "instance": str(request.url.path),
        "trace_id": trace_id,
    }
    if errors:
        payload["errors"] = errors
    return JSONResponse(
        status_code=status_code,
        content=payload,
        media_type="application/problem+json",
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemException)
    async def problem_exception_handler(request: Request, exc: ProblemException):
        return build_problem_response(
            request=request,
            status_code=exc.status_code,
            title=exc.title,
            detail=exc.detail,
            problem_type=exc.problem_type,
            errors=exc.errors,
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
            errors.append(
                {
                    "field": loc or "body",
                    "code": err.get("type", "validation_error"),
                    "message": err.get("msg", "Invalid value"),
                }
            )
        first_msg = errors[0]["message"] if errors else "One or more request parameters failed validation."
        return build_problem_response(
            request=request,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            title="Validation Failed",
            detail=first_msg,
            problem_type="https://globaltolocal.in/problems/validation-error",
            errors=errors,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        titles = {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            409: "Conflict",
            422: "Validation Failed",
            429: "Too Many Requests",
        }
        return build_problem_response(
            request=request,
            status_code=exc.status_code,
            title=titles.get(exc.status_code, "HTTP Error"),
            detail=detail,
            problem_type=f"https://globaltolocal.in/problems/http-{exc.status_code}",
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        trace_id = getattr(request.state, "trace_id", f"req_{uuid.uuid4().hex[:12]}")
        logger.error(
            f"Database error [trace_id={trace_id}] on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )
        return build_problem_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Database Error",
            detail="A database error occurred. Please try again.",
            problem_type="https://globaltolocal.in/problems/database-error",
        )

    @app.exception_handler(Exception)
    async def global_unhandled_exception_handler(request: Request, exc: Exception):
        trace_id = getattr(request.state, "trace_id", f"req_{uuid.uuid4().hex[:12]}")
        logger.error(
            f"Unhandled server error [trace_id={trace_id}] on {request.method} {request.url.path}: {exc}",
            exc_info=True,
        )
        return build_problem_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            title="Internal Server Error",
            detail="Something went wrong. Please try again.",
            problem_type="https://globaltolocal.in/problems/internal-server-error",
        )


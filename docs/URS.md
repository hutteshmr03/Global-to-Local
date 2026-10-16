Global to Local — URS (User Requirements Specification) 
Oct 8, 2026 · @Huttesh M R 
This document lists what shoppers, staff, and the owner need from the rebuilt Global to Local website, 
each with a priority and a test that proves it is met. The implementation stack for this project is React + 
Vite, Python FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT authentication, and Razorpay. A React 
Native + Expo + TypeScript mobile app is a future phase. 
1. Purpose and scope 
Global to Local is a one-shop Goan supermarket at Tarcar Mansion, Fontainhas, Panaji, Goa 403001, 
open 10 AM to 9 PM all week, selling products made in Goa across thirteen shelves. The website is rebuilt 
from scratch with new animations, a working bag and checkout, and a staff admin. The visual design 
and colors stay exactly as they are today. 
Precedence: the live website decides the look, copy and content. This document and the Backend 
Specification decide behavior that the live website does not show, such as the bag, accounts, checkout, 
refunds and the staff admin. 
2. User classes 
User class Who they are What they need 
Visitor Anyone browsing, logged out Explore shelves and products, 
learn the story, find the store 
Registered customer Shopper with a free account Check out, save addresses, track 
orders 
Bulk or corporate buyer Hotels, companies, event 
planners 
Ask for special prices on large 
orders 
Store staff Shop team Manage products, stock, orders 
and enquiries 
Administrator Owner or lead Everything staff do, plus users, 
roles and content 
3. User requirements 
Priority key: Must is needed for launch, Should is expected for launch if time allows, Could can follow 
later. 
Browsing and discovery 
ID Requirement Priority Acceptance test 

ID Requirement Priority Acceptance test 
URS-01 A visitor can browse all 
13 shelves and every 
product without 
logging in 
Must Every shelf and product 
URL loads when logged 
out 
URS-02 A product page shows 
image, name, price in 
₹, unit, availability, 
origin, shipping note 
and related products 
Must All fields appear on 
every product 
URS-03 A visitor can search 
products by name and 
see suggestions as they 
type 
Must Typing a known 
product name lists it in 
suggestions 
URS-04 A visitor can filter by 
shelf, price range and 
in-stock, and sort by 
price, name or newest 
Must Results change and the 
link keeps the chosen 
filters 
URS-05 The home page keeps 
its current content: 
hero, ticker, shelf grid, 
maker story, shell shelf, 
visitors' book 
Must Screenshots match the 
current site 
Accounts 
ID Requirement Priority Acceptance test 
URS-06 A customer can register 
free with email, phone 
and password; one 
account per email and 
phone 
Must A second registration 
with the same email or 
phone is rejected 
URS-07 A customer can log in, 
log out and reset a 
forgotten password 
Must Reset link by email sets 
a new password 
URS-08 A customer can log in 
with a one-time code 
Must Code by SMS or email 
signs the customer in 
URS-09 A customer can save 
several delivery 
Must Addresses can be 
added, edited, deleted 

ID Requirement Priority Acceptance test 
addresses and mark 
one as default 
and defaulted 
URS-10 My Account shows 
active orders, order 
history and editable 
contact details 
Must A customer sees only 
their own orders 
Bag and checkout 
ID Requirement Priority Acceptance test 
URS-11 A visitor can add items 
to the bag without 
registering; the bag 
survives page reloads 
and merges into the 
account on login 
Must Bag contents are intact 
after login 
URS-12 A shopper can change 
quantities, remove 
items and see the 
subtotal 
Must Totals update 
immediately 
URS-13 Only logged-in 
customers can place an 
order; one order ships 
to one address 
Must Checkout redirects a 
logged-out visitor to 
login 
URS-14 The delivery charge is 
shown before payment 
and depends on 
package weight and 
destination; there is no 
minimum order and no 
free-shipping threshold 
Must Quote matches the 
rate table for the 
pincode and weight 
URS-15 Product prices include 
all taxes; only delivery 
is added 
Must Total equals subtotal 
plus delivery 
URS-16 A customer can pay by 
card, UPI or net 
banking and sees a 
confirmation 
Must A test-mode payment 
completes and shows 
the order number 

ID Requirement Priority Acceptance test 
URS-17 An out-of-stock 
product cannot be 
ordered and shows its 
availability 
Must Add to bag is blocked 
at zero stock 
Orders and delivery 
ID Requirement Priority Acceptance test 
URS-18 A customer receives an 
email when the order is 
placed and at each 
status change 
Must Emails arrive for paid, 
shipped and delivered 
URS-19 A customer can follow 
order status and open 
the courier tracking link 
Must Tracking link appears 
after dispatch 
URS-20 A customer can cancel 
an order before it is 
dispatched; a paid 
order is refunded to 
the original payment 
method 
Must Cancel is offered only 
before shipping, 
releases stock and 
starts a refund when 
the order was paid 
Enquiries and content 
ID Requirement Priority Acceptance test 
URS-21 The contact form 
reaches the store team 
Must A submission appears 
in the staff inbox and 
by email 
URS-22 Bulk and corporate 
buyers can send an 
enquiry 
Must Submission is stored 
with type "bulk" 
URS-23 A shopper can send a 
gift-hamper enquiry for 
Goa addresses; the 
form asks for the 
delivery pincode 
Must The pincode is saved 
with the enquiry; non-
Goa pincodes are 
declined with a clear 
message 
URS-24 Visitors can read Our 
Story, Our Social 
Corner, In the News, 
Must All pages load and 
match current content 

ID Requirement Priority Acceptance test 
the FAQs and the four 
policy pages 
URS-25 Visitors can find the 
store address, phone, 
email, hours and a map 
link 
Must Details match the 
footer and contact 
page 
URS-26 Visitors can play the 
"Hear the street" audio 
on request; it never 
autoplays 
Should Audio starts only after 
a click or tap 
Staff and administration 
ID Requirement Priority Acceptance test 
URS-27 Staff can add, edit, hide 
and price products and 
upload images without 
a developer 
Must A new product appears 
on the shop after 
saving 
URS-28 Staff can import 
products from a CSV 
file with a preview of 
errors 
Must A sample file imports 
with a clean report 
URS-29 Staff can view orders, 
change status and 
enter courier tracking 
Must Customer sees the 
change 
URS-30 Staff can adjust stock 
with a reason, and see 
low-stock products 
Must Every change is logged 
URS-31 Staff can read and 
update enquiries 
Must Status changes from 
new to closed 
URS-32 Staff can edit pages, 
FAQs, reviews and 
press items 
Should Edits show on the site 
without a deploy 
URS-33 Staff and 
administrators have 
different permissions 
Must Staff cannot manage 
users or roles 

ID Requirement Priority Acceptance test 
URS-40 Staff can edit store 
details: address, 
phone, email, opening 
hours and social links 
Must Footer and contact 
page show the change 
without a deploy 
URS-41 Staff can refund a paid 
order in full or in part 
and see the refund 
status 
Must Refund appears on the 
order and the 
customer is emailed 
URS-42 Administrators can 
review a log of 
sensitive staff actions 
Must A price change shows 
who made it and when 
Look, feel and quality 
ID Requirement Priority Acceptance test 
URS-34 The layout, colors, 
fonts and imagery are 
identical to the current 
site 
Must Visual comparison 
passes at 360, 768 and 
1440 px 
URS-35 The site has smooth, 
tasteful animations and 
respects the reduced-
motion setting 
Must Motion is off when the 
setting is on 
URS-36 The site works well on 
phones from 360 px 
wide 
Must All flows complete on a 
phone 
URS-37 The site is usable by 
keyboard and screen 
reader 
Must WCAG 2.2 AA checks 
pass 
URS-38 Pages load fast on 
mobile 
Must Largest content shows 
in under 2.5 seconds 
URS-39 Personal data is 
protected; no card 
details are stored by 
the shop; shoppers 
consent to data use 
Must Security and privacy 
review passes 
URS-43 Public pages can be Must Prerendered HTML for 

ID Requirement Priority Acceptance test 
found by search 
engines and show a 
proper preview when 
shared 
product and content 
pages has title, 
description, Open 
Graph tags and 
structured data 
4. Business rules and constraints 
• Everything sold is made in Goa and of Goan origin; about 80% is made by women from self-help 
groups. 
• Gift hampers are packed in Goa and delivered only to Goa addresses. 
• Delivery is by courier partner; charges depend on weight and city. 
• Each email address and phone number belongs to one account. 
• The design, colors and URL structure of the current site must be preserved. 
5. Assumptions and open questions 
• Assumed: Razorpay for payments and a courier aggregator for shipping; the owner can confirm 
the actual providers. 
• Assumed: refunds are issued through Razorpay to the original payment method. 
• Assumed: the existing catalogue (about 230 products) and images can be exported for 
migration. 
• Open: the courier rate card by weight and city, needed before checkout can be finished. 
• Open: who writes and approves the content pages that move into the admin. 
• Open: whether customers need to be able to return items online, or by email only. 
6. Out of scope for the first release 
• Online ordering of gift hampers 
• Coupons, gift cards and subscriptions 
• Interface in languages other than English 
• Product reviews and wishlists 
• Mobile app 
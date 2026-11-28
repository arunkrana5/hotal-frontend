import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  ShieldCheck,
  Building2,
  CalendarCheck,
  Users,
  Sparkles,
  UtensilsCrossed,
  ChefHat,
  GlassWater,
  ShoppingCart,
  Boxes,
  DollarSign,
  UserCheck,
  Wrench,
  ShieldAlert,
  BarChart3,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCode2,
  Printer,
  ChevronRight,
  Layers,
  Settings,
  Terminal,
  Workflow,
  ListOrdered
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  menuPath: string;
  route: string;
  targetRole: string;
  category: 'IT Engine' | 'PMS Core' | 'Operations' | 'Enterprise ERP' | 'Intelligence';
  summary: string;
  prerequisites?: string[];
  steps: {
    step: number;
    title: string;
    description: string;
    actionDetail?: string;
  }[];
  concreteExample: {
    scenario: string;
    inputs: Record<string, string>;
    expectedOutput: string;
    proTip?: string;
  };
}

interface RoleCategory {
  id: string;
  name: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  sections: GuideSection[];
}

export const UserManualScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('it');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('it-masters');

  const roleCategories: RoleCategory[] = [
    {
      id: 'it',
      name: 'IT & System Admin',
      badge: 'Mission-Critical Engine',
      icon: ShieldCheck,
      description: 'System master data, dynamic forms, workflow chains, numbering sequences, and database maintenance.',
      sections: [
        {
          id: 'it-masters',
          title: 'Master Categories & Dynamic Dropdowns',
          menuPath: 'IT Department > Master Management',
          route: '/it/masters',
          targetRole: 'IT Administrator, SuperAdmin',
          category: 'IT Engine',
          summary: 'Configure global metadata, dropdown values, departments, room types, and tax brackets used by all modules.',
          prerequisites: ['SuperAdmin or IT Administrator role privileges'],
          steps: [
            {
              step: 1,
              title: 'Select Master Category',
              description: 'Open Master Management and click the target category on the left panel (e.g., Organization, Rooms, Reservations, Finance).',
              actionDetail: 'Select from 5 core system categories: ORGANIZATION, ROOMS, RESERVATIONS, BILLING, OPERATIONS.'
            },
            {
              step: 2,
              title: 'Choose Master Definition',
              description: 'Click on a definition like "Departments" (DEPARTMENT) or "Room Types" (ROOM_TYPE) to inspect active values.',
              actionDetail: 'Definitions map to dropdown codes throughout Front Office, HR, and Billing.'
            },
            {
              step: 3,
              title: 'Add / Edit Master Value',
              description: 'Click [+ Add Value]. Enter unique Code, Display Name, Sort Order, and optional Description.',
              actionDetail: 'Code must be uppercase alphanumeric without spaces (e.g., SPA, VILLA, POOL).'
            },
            {
              step: 4,
              title: 'Activate & Verify',
              description: 'Toggle IsActive to true and click Save. The new value immediately appears in all relevant dropdowns across HotelOS.',
              actionDetail: 'Changes take effect in real-time across all browser sessions without server restarts.'
            }
          ],
          concreteExample: {
            scenario: 'Add a new "Luxury Presidential Chalet" room type to the hotel inventory dropdown.',
            inputs: {
              'Category': 'ROOMS (Rooms & Housekeeping)',
              'Definition': 'ROOM_TYPE (Room Types)',
              'Code': 'CHALET',
              'Display Name': 'Presidential Chalet',
              'Sort Order': '9',
              'Description': '150sqm detached chalet with private heated pool and butler suite'
            },
            expectedOutput: 'Room allocation and new reservation forms now show "Presidential Chalet (CHALET)" in the room type selector.',
            proTip: 'Never delete an active master value that has historical reservations or invoices attached; instead, toggle IsActive to false.'
          }
        },
        {
          id: 'it-numbering',
          title: 'Document Numbering Architecture',
          menuPath: 'IT Department > Document Numbering',
          route: '/it/numbering',
          targetRole: 'IT Administrator, SuperAdmin',
          category: 'IT Engine',
          summary: 'Universal document numbering engine configuring automated, audit-proof sequence numbers for all 16 business transactions.',
          prerequisites: ['Document Numbering Edit permissions'],
          steps: [
            {
              step: 1,
              title: 'Locate Target Transaction Type',
              description: 'Find the transaction in the Document Numbering table (e.g., RESERVATION, FOLIO, INVOICE, PURCHASE_ORDER, BANQUET_BOOKING).',
              actionDetail: 'Filter by Module (PMS, ERP, F&B, Operations) for faster location.'
            },
            {
              step: 2,
              title: 'Click Edit Sequence',
              description: 'Open the configuration modal. The real-time preview card at the top will dynamically update as you type.',
              actionDetail: 'Inspect Current Sequence and Live Format string.'
            },
            {
              step: 3,
              title: 'Configure Pattern Parameters',
              description: 'Specify Prefix (e.g., RES-, INV-), Suffix (optional, e.g. -HQ), Date Format (yyyyMMdd, yyyyMM, yyyy, none), and Sequence Length (4-8 digits).',
              actionDetail: 'Choose Reset Frequency: Daily (Midnight), Monthly, Yearly, or Never.'
            },
            {
              step: 4,
              title: 'Save & Verify Creation',
              description: 'Click Save Configuration. When any user creates a new record in that module, the next sequence number will automatically generate in this format.',
              actionDetail: 'Audited in configuration.document_number_audits to guarantee zero duplicate invoice or booking numbers.'
            }
          ],
          concreteExample: {
            scenario: 'Configure Banquet Bookings to generate monthly numbers like BNQ-202611-0001.',
            inputs: {
              'Document Type': 'BANQUET_BOOKING',
              'Prefix': 'BNQ-',
              'Date Format': 'yyyyMM (e.g. 202611)',
              'Reset Period': 'Monthly (First of Month)',
              'Sequence Digits': '4',
              'Starting Number': '1',
              'Suffix': 'None'
            },
            expectedOutput: 'Next banquet booking will be automatically numbered BNQ-202611-0001, rolling to BNQ-202611-0002.',
            proTip: 'Use Daily reset frequency for high-volume transactions like KOT or Guest Requests, and Monthly/Yearly for Invoices.'
          }
        },
        {
          id: 'it-forms',
          title: 'Dynamic Form Viewer & Engine',
          menuPath: 'IT Department > Dynamic Forms',
          route: '/it/forms',
          targetRole: 'IT Administrator, Business Analyst',
          category: 'IT Engine',
          summary: 'Build and render custom form schemas with client-side validation without writing frontend React code.',
          prerequisites: ['IT Department Access'],
          steps: [
            {
              step: 1,
              title: 'Select Form Definition',
              description: 'Choose a form schema from the left panel (e.g., VIP Guest Onboarding, Maintenance Check, Incident Report).',
              actionDetail: 'Inspect metadata: Form Code, Title, Target Module, and Version.'
            },
            {
              step: 2,
              title: 'Inspect Dynamic Fields',
              description: 'The engine parses field definitions (Text, Number, Date, Dropdown, Textarea, Checkbox) with validation rules.',
              actionDetail: 'Includes required flags, regex patterns, min/max limits, and default values.'
            },
            {
              step: 3,
              title: 'Live Preview & Validation Test',
              description: 'Fill in the test form on the right pane to verify field layout and trigger client-side validation errors.',
              actionDetail: 'Form data is dynamically parsed into JSON payload ready for API persistence.'
            }
          ],
          concreteExample: {
            scenario: 'Validate a dynamic Maintenance Work Request form with equipment serial number regex.',
            inputs: {
              'Form Code': 'MAINT_WORK_ORDER',
              'Field 1': 'Asset Serial (Regex: ^EQ-[0-9]{5}$)',
              'Field 2': 'Priority (Dropdown: LOW, MED, HIGH, URGENT)',
              'Field 3': 'Scheduled Date (Date picker)'
            },
            expectedOutput: 'Entering "EQ-12345" passes validation; entering invalid strings displays immediate red field error warning.',
            proTip: 'Dynamic forms can be bound to workflow transitions so that submitting the form advances the workflow state.'
          }
        },
        {
          id: 'it-workflows',
          title: 'Workflow Engine & Approvals',
          menuPath: 'IT Department > Workflows',
          route: '/it/workflows',
          targetRole: 'IT Administrator, Department Head',
          category: 'IT Engine',
          summary: 'Model multi-step approval pipelines for purchase requisitions, maintenance orders, and high-value folio refunds.',
          prerequisites: ['it.workflows.manage permission'],
          steps: [
            {
              step: 1,
              title: 'Select Workflow Definition',
              description: 'Select an approval workflow (e.g., Purchase Requisition Approval, High Value Refund, Staff Leave).',
              actionDetail: 'View state graph: Draft -> Department Head Review -> Finance Approval -> Complete.'
            },
            {
              step: 2,
              title: 'Define Steps & Allowed Roles',
              description: 'Assign which roles have authorization to approve, reject, or request revision at each stage.',
              actionDetail: 'SuperAdmin retains universal bypass authority for emergency overrides.'
            },
            {
              step: 3,
              title: 'Audit Historical Instances',
              description: 'Click Active Instances to trace execution history, who approved each step, timestamps, and comments.',
              actionDetail: 'All transitions are logged in workflow.workflow_histories for compliance audits.'
            }
          ],
          concreteExample: {
            scenario: 'Purchase Requisition workflow requiring Manager approval for orders above $500.',
            inputs: {
              'Workflow': 'PURCHASE_REQ_V1',
              'Initial State': 'SUBMITTED',
              'Approver Role': 'Finance Director / Purchase Manager',
              'Timeout': '48 Hours'
            },
            expectedOutput: 'Requisitions remain in "Pending Approval" state until the Finance Director signs off, then automatically unlock for PO generation.',
            proTip: 'Always include a "Rejected / Send Back for Revision" transition so users do not have to recreate the entire requisition from scratch.'
          }
        },
        {
          id: 'it-maintenance',
          title: 'Database Reset & System Cloning',
          menuPath: 'Backend CLI / Maintenance Scripts',
          route: '/it/dashboard',
          targetRole: 'DevOps, System Engineer, IT Admin',
          category: 'IT Engine',
          summary: 'Turnkey procedures to wipe and re-seed database data, manage PostgreSQL connection parameters, and deploy HotelOS on new machines.',
          prerequisites: ['Access to server terminal or backend directory'],
          steps: [
            {
              step: 1,
              title: 'Execute Automated Reset Script',
              description: 'Navigate to hotel-backend folder and run `reset_db.bat` (Windows) or `.\\reset_db.ps1 -Force` (PowerShell).',
              actionDetail: 'Alternatively run: `dotnet run --project src/HotelOS.Api -- --reset-db`'
            },
            {
              step: 2,
              title: 'Verify Automatic EF Migrations',
              description: 'The script drops all 18 schemas cascade, executes all 6 migrations, and re-seeds baseline data in under 15 seconds.',
              actionDetail: 'Restores default SuperAdmin: admin / Admin@HotelOS2026!'
            },
            {
              step: 3,
              title: 'Cloning to a New Machine',
              description: 'Clone repos -> Create database hotelos_db in PostgreSQL -> Start backend (`dotnet run`). All tables and data are seeded automatically.',
              actionDetail: 'Check connection string in `hotel-backend/src/HotelOS.Api/appsettings.json` if PostgreSQL password is not postgres.'
            }
          ],
          concreteExample: {
            scenario: 'Reset a staging server to pristine demo state after running test bookings.',
            inputs: {
              'Command': 'reset_db.bat -y',
              'Target DB': 'hotelos_db',
              'Default User': 'admin',
              'Default Pass': 'Admin@HotelOS2026!'
            },
            expectedOutput: 'All test folios, guests, and orders wiped; 16 clean rooms (101-305) restored, all numbering counters reset to 1.',
            proTip: 'Never run reset_db on a production server without performing a pg_dump backup first.'
          }
        }
      ]
    },
    {
      id: 'frontoffice',
      name: 'Front Office & Reception',
      badge: 'PMS Operations',
      icon: Building2,
      description: 'Room grid management, guest check-in, departures, folio billing, and guest service requests.',
      sections: [
        {
          id: 'fo-grid',
          title: 'Room Allocation Grid & Live Status',
          menuPath: 'Front Office > Room Allocation Grid',
          route: '/front-office/room-grid',
          targetRole: 'Front Desk Agent, Duty Manager',
          category: 'PMS Core',
          summary: 'Interactive real-time visual matrix of all property rooms organized by floor, room type, and housekeeping condition.',
          steps: [
            {
              step: 1,
              title: 'Filter by Floor or Status',
              description: 'Use the quick filter bar to view All Floors, Floor 1, Floor 2, or filter by Clean, Occupied, Dirty, or Maintenance.',
              actionDetail: 'Color coding: Green = Clean & Ready, Pink = Dirty / Turnover, Blue = Occupied, Amber = Maintenance.'
            },
            {
              step: 2,
              title: 'Inspect Room Details',
              description: 'Click any room card to open the quick action drawer showing current guest, rate per night, and housekeeping history.',
              actionDetail: 'Displays room type, maximum occupancy, and active reservation reference.'
            },
            {
              step: 3,
              title: 'Execute Quick Actions',
              description: 'From the room drawer, assign clean room to incoming arrival, request priority cleaning, or flag as Out of Order.',
              actionDetail: 'Direct one-click access to Guest Folio if room is occupied.'
            }
          ],
          concreteExample: {
            scenario: 'Front desk assigns Room 102 (Deluxe Double) to an arriving guest.',
            inputs: {
              'Room Number': '102',
              'Condition': 'Clean & Inspected (Green)',
              'Guest Name': 'Alexander Wright',
              'Nights': '3'
            },
            expectedOutput: 'Room 102 state toggles to Occupied (Blue); keycard is issued and guest folio is initialized.',
            proTip: 'Always check that the room status is "Clean & Inspected" before assigning to avoid guest complaints.'
          }
        },
        {
          id: 'fo-arrivals',
          title: 'Guest Arrivals & Check-In Processing',
          menuPath: 'Front Office > Arrivals & Check-In',
          route: '/front-office/arrivals',
          targetRole: 'Front Desk Receptionist',
          category: 'PMS Core',
          summary: 'Streamlined check-in queue listing all guests scheduled to arrive today with identity verification and keycard issuance.',
          steps: [
            {
              step: 1,
              title: 'Search Reservation',
              description: 'Locate arriving guest by Confirmation Number (e.g. RES-202611-0001) or Guest Surname.',
              actionDetail: 'Filter by VIP tier or pending payment status.'
            },
            {
              step: 2,
              title: 'Verify Identification & Contact Details',
              description: 'Confirm passport/ID number, mobile phone, and email address in the guest profile card.',
              actionDetail: 'Capture corporate GSTIN / Tax ID if corporate billing is requested.'
            },
            {
              step: 3,
              title: 'Assign Room & Complete Check-In',
              description: 'Select an available clean room matching the booked room type. Click [Complete Check-In].',
              actionDetail: 'Automatically generates Folio, posts Room Charge Day 1, and updates Housekeeping board.'
            }
          ],
          concreteExample: {
            scenario: 'Check in VIP guest Victoria Sterling arriving on reservation RES-202611-0002.',
            inputs: {
              'Confirmation #': 'RES-202611-0002',
              'Assigned Room': 'Room 201 (Executive King Suite)',
              'Payment Guarantee': 'Credit Card Pre-Auth $500',
              'Keycards Issued': '2'
            },
            expectedOutput: 'Reservation status switches to Checked-In; Room 201 marked Occupied; Welcome SMS/email notification dispatched.',
            proTip: 'If room is not clean yet, use "Luggage Stored / Pre-Registered" flag to welcome the guest while notifying Housekeeping for rush turnaround.'
          }
        },
        {
          id: 'fo-folios',
          title: 'Guest Folios & Invoicing',
          menuPath: 'Front Office > Guest Folios & Billing',
          route: '/front-office/folios',
          targetRole: 'Cashier, Front Office Manager, Night Auditor',
          category: 'PMS Core',
          summary: 'Financial management of guest stay accounts: room charges, restaurant postings, laundry charges, payments, and invoice checkout.',
          steps: [
            {
              step: 1,
              title: 'Open Guest Folio',
              description: 'Select active folio by Room Number or Folio Number (e.g. FOL-0001).',
              actionDetail: 'Review summary: Total Invoiced, Paid Amount, and Current Balance Due.'
            },
            {
              step: 2,
              title: 'Post Incidental Charges',
              description: 'Click [+ Post Charge]. Select Charge Code (Minibar, Spa, Room Service, Laundry), enter amount and description.',
              actionDetail: 'Charges from POS and Laundry automatically link here via room charge posting.'
            },
            {
              step: 3,
              title: 'Record Payment & Settle Folio',
              description: 'Click [Receive Payment]. Select Method (Credit Card, Cash, UPI, Direct Bill), enter amount, and generate final Invoice.',
              actionDetail: 'Invoice document is assigned sequential numbering (e.g. INV-0001) with tax breakdown.'
            }
          ],
          concreteExample: {
            scenario: 'Checkout and settle bill for Room 301 totaling $850 ($750 room + $100 restaurant).',
            inputs: {
              'Room': '301',
              'Folio ID': 'FOL-0005',
              'Payment Method': 'Corporate Amex Credit Card',
              'Settlement Amount': '$850.00'
            },
            expectedOutput: 'Balance Due becomes $0.00; Folio closed; Invoice INV-0005 printed/emailed; Room 301 marked Dirty for turnover.',
            proTip: 'Never checkout a guest with an outstanding balance unless routed to an approved Corporate City Ledger account.'
          }
        }
      ]
    },
    {
      id: 'reservations',
      name: 'Reservations & Bookings',
      badge: 'Revenue Engine',
      icon: CalendarCheck,
      description: 'Reservation registry, walk-in bookings, advance booking engine, and rate plan management.',
      sections: [
        {
          id: 'res-new',
          title: 'Creating a New Reservation',
          menuPath: 'Reservations > New Reservation',
          route: '/reservations/new',
          targetRole: 'Reservation Agent, Sales Executive',
          category: 'PMS Core',
          summary: 'Complete booking creation workflow capturing dates, room category, rate plan, guest details, and advance deposits.',
          steps: [
            {
              step: 1,
              title: 'Define Stay Dates & Occupancy',
              description: 'Input Check-In Date, Check-Out Date, Adults, and Children. The system checks live availability across all room types.',
              actionDetail: 'Calculates total nights automatically.'
            },
            {
              step: 2,
              title: 'Select Room Type & Rate Plan',
              description: 'Choose from available room categories (Deluxe, Executive Suite, Ocean Villa). Select Rate Plan (Best Available Rate, Corporate, MAP).',
              actionDetail: 'Displays nightly rate and total estimated accommodation charge.'
            },
            {
              step: 3,
              title: 'Input Guest Profile & Special Requests',
              description: 'Search existing guest database to auto-populate preferences, or create new profile. Note special requests (Airport Pickup, High Floor).',
              actionDetail: 'Document Numbering engine automatically reserves the next sequential Reservation ID.'
            },
            {
              step: 4,
              title: 'Confirm & Generate Booking',
              description: 'Click [Create Reservation]. A booking confirmation is generated and confirmation email dispatched to guest.',
              actionDetail: 'Inventory availability is updated in real-time across all channels.'
            }
          ],
          concreteExample: {
            scenario: 'Book a 4-night stay for Dr. Elena Rostova in an Ocean View Villa.',
            inputs: {
              'Check-In': '2026-12-01',
              'Check-Out': '2026-12-05 (4 Nights)',
              'Room Type': 'OCN (Ocean View Villa)',
              'Rate Plan': 'BAR Breakfast Included ($450/night)',
              'Guest': 'Dr. Elena Rostova (elena.rostova@techcorp.com)'
            },
            expectedOutput: 'Generated Reservation RES-202611-0003; Ocean Villa inventory reduced by 1 for selected dates.',
            proTip: 'For corporate clients, ensure you link their Corporate Profile to apply contracted discount rates automatically.'
          }
        }
      ]
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping & Laundry',
      badge: 'Hygiene & Rooms',
      icon: Sparkles,
      description: 'Room turnover status board, attendant assignments, linen inventory, and laundry dispatch.',
      sections: [
        {
          id: 'hk-board',
          title: 'Room Status Board & Attendant Assignment',
          menuPath: 'Housekeeping > Room Status Board',
          route: '/housekeeping/board',
          targetRole: 'Executive Housekeeper, Floor Supervisor',
          category: 'Operations',
          summary: 'Live tracking of cleaning progress, supervisor inspections, and instant status updates for the front desk.',
          steps: [
            {
              step: 1,
              title: 'Review Morning Departure Turnover',
              description: 'Filter by "Dirty / Vacant" to prioritize rooms of checked-out guests whose incoming arrivals are due today.',
              actionDetail: 'Turnover target: 25 minutes for standard checkout, 40 minutes for suites.'
            },
            {
              step: 2,
              title: 'Assign Attendant to Room',
              description: 'Assign room to floor housekeeper (e.g. Maria Gonzalez - Floor 1). State updates to "Cleaning in Progress".',
              actionDetail: 'Housekeeper marks task complete upon linen change, dusting, and bathroom sanitation.'
            },
            {
              step: 3,
              title: 'Supervisor Inspection & Approval',
              description: 'Supervisor inspects cleaned room against checklist (bedding, amenities, cleanliness). Clicks [Certify & Inspect].',
              actionDetail: 'Room status transitions to "Clean & Inspected", instantly unlocking for Front Desk check-in.'
            }
          ],
          concreteExample: {
            scenario: 'Room 101 vacated at 11:00 AM; incoming arrival due at 2:00 PM.',
            inputs: {
              'Room': '101',
              'Initial Status': 'DRT (Dirty / Vacant)',
              'Assigned Attendant': 'Housekeeper Team A',
              'Inspection Result': '100% Passed Checklist'
            },
            expectedOutput: 'Room 101 status updates to INS (Inspected & Approved); Front Desk receives green badge.',
            proTip: 'Use "DND" (Do Not Disturb) status if guest refuses service; report to Front Office if DND extends past 24 hours.'
          }
        },
        {
          id: 'hk-linen',
          title: 'Linen Par Levels & Laundry Cycles',
          menuPath: 'Housekeeping > Linen & Laundry',
          route: '/housekeeping/linen',
          targetRole: 'Laundry Manager, Linen Supervisor',
          category: 'Operations',
          summary: 'Manage linen stock ratios (bedsheets, pillow covers, duvet covers, bath towels) and track commercial laundry vendor cycles.',
          steps: [
            {
              step: 1,
              title: 'Monitor Linen Par Levels',
              description: 'Inspect Clean Stock vs. Par Level. If Clean Stock dips below 60% of par level, initiate laundry dispatch.',
              actionDetail: 'Items tracked: King/Queen Sheets, Pillow Cases, Duvet Covers, Bath Towels.'
            },
            {
              step: 2,
              title: 'Create Laundry Out Batch',
              description: 'Bundle soiled linen, record counts per item, and generate Laundry Dispatch Order to commercial vendor.',
              actionDetail: 'Dispatched quantity shifts from In-Use to In-Laundry stock.'
            },
            {
              step: 3,
              title: 'Receive Cleaned Linen',
              description: 'Verify returned counts against dispatch slip. Record any torn or discarded items, and restock clean linen stores.',
              actionDetail: 'Damaged linen automatically updates Discarded Stock.'
            }
          ],
          concreteExample: {
            scenario: 'Dispatch 50 King Bedsheets and 80 Bath Towels to City Laundry Services.',
            inputs: {
              'Vendor': 'Premier Commercial Laundry',
              'Items': '50x King Fitted Sheets, 80x Bath Towels',
              'Expected Return': '24 Hours (Next Day 10 AM)'
            },
            expectedOutput: 'Clean stock adjusted; Laundry Order LND-0001 tracked; vendor bill reconciliation linked upon return.',
            proTip: 'Maintain a 3.0 Par level: 1 set on bed, 1 set in floor linen pantry, 1 set in laundry wash cycle.'
          }
        }
      ]
    },
    {
      id: 'restaurant',
      name: 'Restaurant POS & Kitchen',
      badge: 'Food & Beverage',
      icon: UtensilsCrossed,
      description: 'Dining floor management, table orders, KOT generation, live KDS kitchen display, and bill settlements.',
      sections: [
        {
          id: 'pos-live',
          title: 'Live POS Terminal & Table Ordering',
          menuPath: 'Restaurant & POS > Live POS Terminal',
          route: '/restaurant/pos',
          targetRole: 'F&B Captain, Waiter, Cashier',
          category: 'Operations',
          summary: 'Fast touch-enabled point-of-sale terminal for dining tables, in-room dining orders, and bar tickets.',
          steps: [
            {
              step: 1,
              title: 'Select Dining Table or Outlet',
              description: 'Click an available table (e.g., Table 4 - Main Dining Room) or choose "Takeaway / Room Service".',
              actionDetail: 'Table card indicates occupancy status, current server, and elapsed dining time.'
            },
            {
              step: 2,
              title: 'Add Menu Items to Cart',
              description: 'Browse categories (Starters, Main Course, Beverages, Desserts) or search item code. Click to add.',
              actionDetail: 'Add item modifiers (e.g., "Medium Rare", "No Onions", "Extra Spicy").'
            },
            {
              step: 3,
              title: 'Send KOT to Kitchen',
              description: 'Click [Send to Kitchen]. Kitchen Order Ticket (KOT) is generated and appears instantly on Kitchen KDS screens.',
              actionDetail: 'Table status turns Occupied (Amber).'
            },
            {
              step: 4,
              title: 'Bill Settlement & Room Post',
              description: 'When dining completes, click [Settle Bill]. Choose Cash, Card, or click [Post to Room] to charge guest folio directly.',
              actionDetail: 'Room charge verifies guest registered room status and applies to active folio.'
            }
          ],
          concreteExample: {
            scenario: 'Table 2 orders 2x Grilled Atlantic Salmon and 1x Sparkling Water, billed to Room 201.',
            inputs: {
              'Table': 'T-02 (2 Guests)',
              'Items': '2x Grilled Atlantic Salmon ($64), 1x San Pellegrino ($8)',
              'Tax': '8.5% GST ($6.12)',
              'Payment Method': 'Charge to Room 201 (Alexander Wright)'
            },
            expectedOutput: 'KOT sent to kitchen hot line; receipt settled; $78.12 added to Folio for Room 201; Table 2 freed.',
            proTip: 'Always verify guest surname matches the room before posting F&B charges to guest folios.'
          }
        },
        {
          id: 'kds-screen',
          title: 'Kitchen Display System (KDS)',
          menuPath: 'Kitchen (KDS) > Kitchen Queue',
          route: '/kitchen/queue',
          targetRole: 'Executive Chef, Sous Chef, Line Cook',
          category: 'Operations',
          summary: 'Paperless kitchen ticket display organized by order priority, cooking station, and elapsed preparation timers.',
          steps: [
            {
              step: 1,
              title: 'View Incoming Orders',
              description: 'Tickets appear with table number, waiter, item quantities, special dietary instructions, and live timers.',
              actionDetail: 'Tickets color code: Green (< 10 mins), Amber (10-20 mins), Red (> 20 mins alert).'
            },
            {
              step: 2,
              title: 'Start Preparation',
              description: 'Click [Start Prep] on the order card. Changes status to "Cooking" so front of house knows food is in progress.',
              actionDetail: 'Filtered by station: Hot Line, Cold Pantry, Bakery, Grill.'
            },
            {
              step: 3,
              title: 'Bump Ticket / Order Ready',
              description: 'When plating is completed, click [Mark Ready / Bump]. Notifies floor servers for instant food delivery.',
              actionDetail: 'Ticket archives and metrics feed into average kitchen turnaround analytics.'
            }
          ],
          concreteExample: {
            scenario: 'Chef completes preparation for Table 5 starters.',
            inputs: {
              'Order #': 'KOT-0042',
              'Items': '1x Truffle Wild Mushroom Risotto, 1x Caesar Salad',
              'Elapsed Time': '12 Minutes'
            },
            expectedOutput: 'Ticket bumped; waiter runner alert triggers; order marked "Ready for Service".',
            proTip: 'Sort by "Longest Waiting" during peak lunch and dinner rush hours to minimize table wait times.'
          }
        },
        {
          id: 'pos-room-qr',
          title: 'Room QR Management & Printable Tent Cards',
          menuPath: 'Restaurant & POS > Room QR Management',
          route: '/restaurant/qr',
          targetRole: 'F&B Manager, IT Administrator, Front Office',
          category: 'Operations',
          summary: 'Generate, monitor, preview and bulk-print cryptographic QR codes for every hotel room, allowing guests to order in-room dining and request amenities directly from their smartphone cameras.',
          steps: [
            {
              step: 1,
              title: 'Monitor Room QR Code Roster',
              description: 'Review configured rooms, active statuses, guest scan counts, and security PIN requirements in the one-record, one-row table.',
              actionDetail: 'Filter by Active, Revoked, or PIN Protected rooms.'
            },
            {
              step: 2,
              title: 'Generate Single or Bulk QR Codes',
              description: 'Click [+ Add Room QR] for an individual room or [Bulk Generate] to provision tokens for all active hotel rooms at once.',
              actionDetail: 'Cryptographically opaque, non-sequential tokens protect against room-spoofing attacks.'
            },
            {
              step: 3,
              title: 'Preview & Download High-Res PNGs',
              description: 'Click [Preview] on any room row to view the QR code canvas, copy the direct guest link, or download a 300 DPI PNG file.',
              actionDetail: 'Direct guest links allow customer service to assist guests if camera issues arise.'
            },
            {
              step: 4,
              title: 'Print Physical Nightstand Tent Cards',
              description: 'Click [Card] on a single room or [Print All Cards] for a multi-room batch sheet formatted for table tent cards and cardstock.',
              actionDetail: 'Cards include hotel branding, room badge, stylized QR code, and clear scan instructions.'
            },
            {
              step: 5,
              title: 'Regenerate or Revoke QR Tokens',
              description: 'If a physical tent card is misplaced or room security is compromised, click [Regenerate] to invalidate the old token immediately, or [Revoke] to shut down ordering.',
              actionDetail: 'Old QR codes immediately return an invalid token message to any subsequent scans.'
            }
          ],
          concreteExample: {
            scenario: 'Generate and print table tent card for newly refurbished Executive Suite 402 with optional PIN protection.',
            inputs: {
              'Room': 'Room 402 (Executive Suite)',
              'Security PIN': '4020 (Enabled)',
              'Card Format': 'Single Luxury Table Tent Card',
              'Action': 'Generate & Print'
            },
            expectedOutput: 'Cryptographic token assigned; QR code preview generated; printable card sent to front desk color printer.',
            proTip: 'Print cards on laminated cardstock so housekeeping can wipe and sanitize them during room turns without smudging.'
          }
        },
        {
          id: 'pos-room-orders',
          title: 'In-Room Dining Orders & Runner Dispatch',
          menuPath: 'Restaurant & POS > Room Orders',
          route: '/restaurant/room-orders',
          targetRole: 'In-Room Dining Captain, Order Taker, Runner',
          category: 'Operations',
          summary: 'Real-time operations dashboard for monitoring guest self-service orders from instant placement to kitchen prep, runner dispatch, and room delivery.',
          steps: [
            {
              step: 1,
              title: 'Receive Real-Time Order Alerts',
              description: 'New orders placed via room QR appear instantly with pulsing badges, room number badge, guest name, and elapsed timer.',
              actionDetail: 'Sound and visual pulse alert staff when a new order lands in the queue.'
            },
            {
              step: 2,
              title: 'Inspect Order Drawer & Instructions',
              description: 'Click [Manage] to open the full order drawer. Review ordered items, guest preparation notes (e.g. extra spicy, no onions), and delivery instructions (e.g. ring bell twice).',
              actionDetail: 'Verifies stay attribution: "Stay Verified" badge confirms guest is registered in-house in that room.'
            },
            {
              step: 3,
              title: 'Advance Order Lifecycle',
              description: 'Click [Accept Order] to confirm delivery ETA. Click [Send to Kitchen] to route KOT tickets directly to line cooks.',
              actionDetail: 'Kitchen KDS screen immediately displays room ticket with blue Room Service badge.'
            },
            {
              step: 4,
              title: 'Dispatch Runner & Mark Delivered',
              description: 'When kitchen marks ready, assign the runner staff name and click [Dispatch]. Once handed to guest, click [Mark Delivered].',
              actionDetail: 'If payment method is "Charge to Room", system automatically creates an F&B charge on the active guest folio.'
            }
          ],
          concreteExample: {
            scenario: 'In-house guest in Room 305 orders late-night dining charged to room folio.',
            inputs: {
              'Order #': 'RS-20261128-0003',
              'Room': 'Room 305 (Stay Verified: Sophia Martinez)',
              'Items': '1x Wagyu Burger ($28), 1x Truffle Fries ($12), 1x San Pellegrino ($8)',
              'Total': '$50.40 (incl. 5% tax)',
              'Payment': 'Charge to Room Folio (Folio #FOL-1049)'
            },
            expectedOutput: 'Order accepted with 25 min ETA; KDS notified; runner dispatched; $50.40 posted to Master Folio; order marked Delivered.',
            proTip: 'Use the elapsed timer badge to identify any in-room orders taking longer than 20 minutes so you can call the kitchen expediters.'
          }
        },
        {
          id: 'guest-self-service',
          title: 'Guest Mobile Self-Service Portal',
          menuPath: 'Guest In-Room Mobile Portal (/guest/q/:token)',
          route: '/guest/q/demo',
          targetRole: 'In-House Hotel Guest & Customer Experience',
          category: 'Operations',
          summary: 'Zero-install mobile web application that opens when guests scan their in-room QR code with any smartphone camera. Enables browsing menus, ordering food, tracking arrival, and requesting hotel services.',
          steps: [
            {
              step: 1,
              title: 'Camera Scan & Instant Identification',
              description: 'Guest points camera at table tent card. Web browser opens directly to verified room portal without installing any native app.',
              actionDetail: 'System validates room stay, welcomes guest by name, and loads active menus.'
            },
            {
              step: 2,
              title: 'Browse Menu & Dietary Filters',
              description: 'Guests filter by categories (Breakfast, Mains, Starters, Desserts, Beverages), toggle Veg Only, or use live search.',
              actionDetail: 'Displays item prices, preparation times, dietary tags, and rich descriptions.'
            },
            {
              step: 3,
              title: 'Customize Items & Cart Drawer',
              description: 'Guest adds items, specifies preparation notes per dish (e.g. dressing on the side), and reviews the itemized bill with 5% VAT.',
              actionDetail: 'Choose "Charge to Room Folio" or "Pay on Delivery". Add delivery instructions (e.g., leave outside door).'
            },
            {
              step: 4,
              title: 'Live 5-Stage Order Tracking',
              description: 'After placing order, screen transitions to live tracker with animated countdown ETA, stage indicator (Placed -> Accepted -> Cooking -> On the Way -> Delivered), and assigned runner.',
              actionDetail: 'Auto-refreshes every 10 seconds with zero manual refreshing needed.'
            },
            {
              step: 5,
              title: 'In-Room Hotel Services & Amenities',
              description: 'Switch to the "Hotel Services" tab to request extra towels, room cleaning, mineral water, luggage assistance, or maintenance with a single tap.',
              actionDetail: 'Generates real-time service requests directly in the Front Office & Housekeeping queues.'
            }
          ],
          concreteExample: {
            scenario: 'Guest in Room 102 scans QR code to order breakfast and request 2 extra bath towels.',
            inputs: {
              'Scan Device': 'iPhone Camera (Safari Mobile)',
              'Food Order': '2x Continental Breakfast, 2x Fresh Orange Juice ($44.10)',
              'Service Request': 'Extra Towels (Housekeeping)',
              'Payment': 'Charge to Room Folio'
            },
            expectedOutput: 'Food order sent to room service kitchen; housekeeping alert generated for towel delivery; guest tracks arrival on phone.',
            proTip: 'Guests can keep the tracking tab open on their phone while working or relaxing to see when the runner is knocking on the door.'
          }
        }
      ]
    },
    {
      id: 'banquet',
      name: 'Banquets & Events',
      badge: 'Event Sales',
      icon: GlassWater,
      description: 'Event halls, wedding venues, conference bookings, function catering packages, and deposit tracking.',
      sections: [
        {
          id: 'bnq-events',
          title: 'Banquet Bookings & Function Sheets',
          menuPath: 'Banquets & Events > Event Bookings',
          route: '/banquet/events',
          targetRole: 'Banquet Sales Manager, Event Coordinator',
          category: 'Operations',
          summary: 'End-to-end event management from initial inquiry, hall reservation, menu package selection, to billing.',
          steps: [
            {
              step: 1,
              title: 'Create Event Booking',
              description: 'Click [+ New Event Booking]. Select Venue (e.g. Grand Crystal Ballroom) and date/time window.',
              actionDetail: 'Check space capacity (e.g. Theater: 300, Banquet: 180, Classroom: 120).'
            },
            {
              step: 2,
              title: 'Select Catering & Audio-Visual Package',
              description: 'Choose meal plan (High Tea, Cocktail Reception, 4-Course Gala Dinner) and AV equipment requirements.',
              actionDetail: 'System calculates rate per head multiplied by guaranteed guest count.'
            },
            {
              step: 3,
              title: 'Record Advance Deposit & Finalize Contract',
              description: 'Capture advance deposit (e.g. 50% deposit) and generate Function Prospectus for Kitchen & Banquet setup crew.',
              actionDetail: 'Auto-numbers with document sequence (e.g. BNQ-202611-0001).'
            }
          ],
          concreteExample: {
            scenario: 'Global Tech Annual Awards Gala in Grand Crystal Ballroom for 150 guests.',
            inputs: {
              'Event Name': 'Global Tech Awards Gala',
              'Hall': 'Grand Crystal Ballroom',
              'Guests': '150 Attendees',
              'Package': 'Premium Gala Buffet ($85/person)',
              'Deposit Received': '$5,000.00'
            },
            expectedOutput: 'Booking BNQ-202611-0001 confirmed; venue locked for date; kitchen function sheet dispatched.',
            proTip: 'Always lock in minimum guaranteed guest count in contract 72 hours before event to prevent F&B cost overrun.'
          }
        }
      ]
    },
    {
      id: 'erp',
      name: 'Enterprise ERP & Finance',
      badge: 'Procurement, Stock & Accounts',
      icon: DollarSign,
      description: 'Purchase requisitions, purchase orders, stores inventory, chart of accounts, journal entries, and invoices.',
      sections: [
        {
          id: 'erp-purchase',
          title: 'Procurement: Requisitions to Purchase Orders',
          menuPath: 'Purchase & Vendor > Purchase Requisitions / Orders',
          route: '/purchase/requisitions',
          targetRole: 'Purchase Officer, Head of Department',
          category: 'Enterprise ERP',
          summary: 'Structured procurement cycle ensuring all department material requests are approved before PO issuance.',
          steps: [
            {
              step: 1,
              title: 'Department Submits Requisition',
              description: 'Department (e.g., Kitchen or Maintenance) creates Requisition with required items, quantities, and urgency.',
              actionDetail: 'Automatically numbered: PR-2026-0001.'
            },
            {
              step: 2,
              title: 'Approval & PO Generation',
              description: 'Purchase manager reviews requisition, selects approved vendor, quotes agreed unit rates, and clicks [Generate PO].',
              actionDetail: 'Purchase Order generated: PO-2026-0001 with delivery terms and payment milestones.'
            },
            {
              step: 3,
              title: 'Goods Receipt & Inventory Integration',
              description: 'Upon physical delivery, storekeeper records Goods Received Note (GRN); inventory automatically updates stock levels.',
              actionDetail: 'Accounts Payable invoice is initialized in Finance.'
            }
          ],
          concreteExample: {
            scenario: 'Executive Chef requests 100kg Basmati Rice and 50 Liters Olive Oil.',
            inputs: {
              'Vendor': 'Metro Wholesale Food Supplies (VND-001)',
              'Items': '100kg Royal Basmati Rice, 50L Extra Virgin Olive Oil',
              'Total Cost': '$620.00'
            },
            expectedOutput: 'Purchase Order PO-2026-0001 dispatched to vendor; stock items pre-allocated.',
            proTip: 'Always check existing inventory par levels before approving requisitions to avoid over-ordering perishable goods.'
          }
        },
        {
          id: 'erp-inventory',
          title: 'Inventory Item Master & Stores Ledger',
          menuPath: 'Inventory & Stores > Inventory Items',
          route: '/inventory/items',
          targetRole: 'Storekeeper, Inventory Controller',
          category: 'Enterprise ERP',
          summary: 'Complete tracking of food & beverage supplies, guest amenities, cleaning chemicals, and engineering spares.',
          steps: [
            {
              step: 1,
              title: 'Track Stock on Hand vs. Reorder Threshold',
              description: 'View current quantities, minimum reorder levels, and average purchase cost per unit.',
              actionDetail: 'Items highlighted in red when stock falls below minimum safety stock.'
            },
            {
              step: 2,
              title: 'Post Department Issues & Transfers',
              description: 'Record stock issues to departments (e.g. issuing 10 boxes of guest soaps to Housekeeping).',
              actionDetail: 'Deducts from Central Stores and posts department expense in General Ledger.'
            },
            {
              step: 3,
              title: 'Periodic Physical Stock Count (Stocktake)',
              description: 'Conduct monthly physical audit and post variance adjustments with supervisor justification.',
              actionDetail: 'Audited in inventory.stock_transactions.'
            }
          ],
          concreteExample: {
            scenario: 'Issue 20 bottles of disinfectant cleaner to Housekeeping Department.',
            inputs: {
              'Item SKU': 'INV-CHM-002 (Multi-surface Disinfectant 5L)',
              'Quantity Issued': '20',
              'Receiving Dept': 'Housekeeping (HK)'
            },
            expectedOutput: 'Central Stores quantity reduced by 20; stock transaction logged; department expense recognized.',
            proTip: 'Perform weekly spot-checks on high-value items (liquor, meat, luxury amenities) to eliminate shrinkage.'
          }
        },
        {
          id: 'erp-finance',
          title: 'General Ledger, Invoicing & Night Audit',
          menuPath: 'Finance & Accounts > General Ledger / Invoices',
          route: '/finance/ledger',
          targetRole: 'Chief Financial Officer, Financial Controller, Night Auditor',
          category: 'Enterprise ERP',
          summary: 'Double-entry enterprise accounting system: chart of accounts, balanced journal vouchers, and night audit balancing.',
          steps: [
            {
              step: 1,
              title: 'Review Chart of Accounts',
              description: 'Navigate assets, liabilities, equity, revenue, and expense accounts structured per USALI hotel standards.',
              actionDetail: 'Accounts 1000-5000 categorized by hotel operational department.'
            },
            {
              step: 2,
              title: 'Create Balanced Journal Voucher',
              description: 'Click [+ New Journal Entry]. Enter date, narration, and add debit/credit lines. Total Debits must equal Total Credits.',
              actionDetail: 'Sequentially numbered: JV-202611-0001.'
            },
            {
              step: 3,
              title: 'Execute Daily Night Audit',
              description: 'Reconcile daily room revenue postings, verify F&B outlet cashier balances, roll business date, and generate Trial Balance.',
              actionDetail: 'Night Audit seals daily transactions and produces executive RevPAR & ADR reports.'
            }
          ],
          concreteExample: {
            scenario: 'Post daily laundry revenue adjustment of $350.',
            inputs: {
              'Debit Account': '1010 - Accounts Receivable Guest ($350)',
              'Credit Account': '4030 - Laundry & Dry Cleaning Revenue ($350)',
              'Narration': 'Daily in-house guest laundry charges posted'
            },
            expectedOutput: 'Balanced journal entry created; General Ledger and Trial Balance updated in real-time.',
            proTip: 'Never roll the night audit business date before ensuring all outlet POS cash registers have performed End of Day (Z-Report).'
          }
        }
      ]
    },
    {
      id: 'hr-maintenance-sec',
      name: 'HR, Maintenance & Security',
      badge: 'Support & Facility',
      icon: Wrench,
      description: 'Employee profiles, shift attendance, facility maintenance work orders, visitor gate passes, and security incidents.',
      sections: [
        {
          id: 'hr-staff',
          title: 'Staff Management & Shift Attendance',
          menuPath: 'HR & Personnel > Staff Directory / Attendance',
          route: '/hr/staff',
          targetRole: 'HR Manager, Shift Supervisor',
          category: 'Enterprise ERP',
          summary: 'Manage hotel staff profiles, department assignments, designations, and daily clock-in / clock-out attendance.',
          steps: [
            {
              step: 1,
              title: 'Maintain Employee Directory',
              description: 'Add employees with full name, department, designation, emergency contacts, and joining date.',
              actionDetail: 'Links employee record to system user accounts for role permission mapping.'
            },
            {
              step: 2,
              title: 'Log Shift Attendance',
              description: 'Record clock-in, clock-out, shift code (Morning, Evening, Night), and mark leaves or overtime.',
              actionDetail: 'Generates monthly attendance reports for payroll calculation.'
            }
          ],
          concreteExample: {
            scenario: 'Record clock-in for Front Desk Receptionist Robert Miller on Morning Shift.',
            inputs: {
              'Employee ID': 'EMP-0042',
              'Shift': 'Morning (07:00 - 15:30)',
              'Clock In': '06:55 AM',
              'Status': 'Present / On Time'
            },
            expectedOutput: 'Attendance record created; employee marked active on property shift roster.',
            proTip: 'Configure shift cutoff times in IT Masters to calculate late-coming and overtime automatically.'
          }
        },
        {
          id: 'maint-orders',
          title: 'Engineering & Work Orders',
          menuPath: 'Engineering & Maintenance > Work Orders',
          route: '/maintenance/orders',
          targetRole: 'Chief Engineer, Duty Technician',
          category: 'Operations',
          summary: 'Facility upkeep: log room defects, dispatch technicians, track spare parts, and prevent room downtime.',
          steps: [
            {
              step: 1,
              title: 'Log Maintenance Work Order',
              description: 'Click [+ New Work Order]. Specify Room/Area (e.g. Room 204), Equipment (e.g. Air Conditioning HVAC), and Issue.',
              actionDetail: 'Priority flags: Low, Medium, High, Emergency / Urgent.'
            },
            {
              step: 2,
              title: 'Assign Technician & Parts',
              description: 'Assign duty technician (e.g., Electrical / HVAC Specialist) and allocate spare parts from engineering inventory.',
              actionDetail: 'Room card on Room Grid automatically reflects Maintenance state if room is out of order.'
            },
            {
              step: 3,
              title: 'Complete & Sign-Off',
              description: 'Technician resolves issue, records repair notes, and closes work order. Room is returned to Housekeeping for final clean.',
              actionDetail: 'Audit logged with repair cost and completion duration.'
            }
          ],
          concreteExample: {
            scenario: 'Repair malfunctioning bathroom water heater in Room 105.',
            inputs: {
              'Location': 'Room 105 (Bathroom)',
              'Issue': 'Thermostat valve tripped, no hot water',
              'Priority': 'High (Guest in-house)',
              'Assigned Tech': 'Engineering Team Lead'
            },
            expectedOutput: 'Work Order WO-2026-0005 generated; technician notified via realtime push alert; room returned to service.',
            proTip: 'Tag recurrent room issues in Asset Register to identify fixtures due for complete replacement during low season.'
          }
        },
        {
          id: 'sec-visitors',
          title: 'Security, Gate Pass & Incident Reports',
          menuPath: 'Security & Surveillance > Visitor Log / Incident Reports',
          route: '/security/visitors',
          targetRole: 'Chief Security Officer, Gate Officer',
          category: 'Operations',
          summary: 'Campus physical security: vendor and visitor badge registration, vehicle monitoring, and incident reporting.',
          steps: [
            {
              step: 1,
              title: 'Issue Visitor / Vendor Pass',
              description: 'Log external visitor name, company, vehicle registration, person to meet, and assign physical visitor badge number.',
              actionDetail: 'Captures entry timestamp and photo ID verification.'
            },
            {
              step: 2,
              title: 'Log Security Incidents',
              description: 'For any property damage, lost & found item, or security breach, create an Incident Report with evidence notes.',
              actionDetail: 'Auto-numbers with INC-2026-0001; notifies Duty Manager and General Manager.'
            },
            {
              step: 3,
              title: 'Checkout Visitor & Audit Badge',
              description: 'Upon departure, scan badge number, record exit time, and close gate pass.',
              actionDetail: 'Ensures zero unaccounted external persons on hotel premises overnight.'
            }
          ],
          concreteExample: {
            scenario: 'Register HVAC maintenance contractor entering facility for chiller servicing.',
            inputs: {
              'Visitor Name': 'Marcus Vance (CoolAir Services)',
              'Vehicle Plate': 'KA-01-MJ-9921',
              'Badge Issued': 'BADGE-V-14',
              'Host Dept': 'Engineering & Maintenance'
            },
            expectedOutput: 'Visitor logged; badge active; gate pass record archived upon exit.',
            proTip: 'Review the active visitor board 30 minutes before Night Audit to verify all contractor badges are surrendered.'
          }
        }
      ]
    },
    {
      id: 'menus-directory',
      name: 'System Menus & Navigation',
      badge: 'Complete Sitemap',
      icon: ListOrdered,
      description: 'Comprehensive directory of all 17 system modules, 45+ submenus, URL routes, required roles, and functional workflows.',
      sections: [
        {
          id: 'menu-sitemap-all',
          title: 'Complete HotelOS Navigation Sitemap & Route Directory',
          menuPath: 'HotelOS Application-Wide Architecture',
          route: '/dashboard',
          targetRole: 'All Staff, Supervisors, General Managers & IT Admins',
          category: 'IT Engine',
          summary: 'Complete architectural map of every navigation menu in HotelOS, detailing primary module, child routes, target roles, and core operational responsibilities.',
          steps: [
            {
              step: 1,
              title: 'Operations & Front Office Hub',
              description: 'Dashboard (/dashboard), Room Status Grid (/front-office/room-grid), Arrivals (/front-office/arrivals), Departures (/front-office/departures), Folios & Billing (/front-office/folios), and Guest Requests (/front-office/requests).',
              actionDetail: 'Operated daily by Front Desk Agents, Duty Managers, and Night Auditors.'
            },
            {
              step: 2,
              title: 'Reservations & Guest Relationship Management',
              description: 'Bookings List (/reservations/list), Create Reservation (/reservations/new), Availability Matrix (/reservations/matrix), Guest Directory (/guests/list), and VIP / Loyalty Profiles (/guests/loyalty).',
              actionDetail: 'Used by Central Reservations (CRO), Front Office, and Guest Relations.'
            },
            {
              step: 3,
              title: 'Housekeeping, Linen & Facilities Hygiene',
              description: 'Room Status Board (/housekeeping/board), Task Assignments (/housekeeping/tasks), Linen & Laundry Log (/housekeeping/linen).',
              actionDetail: 'Used by Executive Housekeeper, Floor Supervisors, and Room Attendants.'
            },
            {
              step: 4,
              title: 'Food & Beverage, In-Room Dining & Kitchen',
              description: 'Live POS Terminal (/restaurant/pos), Table Management (/restaurant/tables), Menu Items & Pricing (/restaurant/items), Room Orders (/restaurant/room-orders), Room QR Management (/restaurant/qr), and Kitchen KDS Queue (/kitchen/queue).',
              actionDetail: 'Used by Restaurant Captains, Waiters, In-Room Dining Runners, and Kitchen Chefs.'
            },
            {
              step: 5,
              title: 'Banquets, Events & Function Spaces',
              description: 'Event Bookings (/banquet/events) and Halls & Function Spaces (/banquet/spaces).',
              actionDetail: 'Used by Banquet Sales Managers and Event Coordinators.'
            },
            {
              step: 6,
              title: 'Enterprise ERP: Procurement, Stores & Financials',
              description: 'Purchase Requisitions (/purchase/requisitions), Purchase Orders (/purchase/orders), Vendor Directory (/purchase/vendors), Stock Items Master (/inventory/items), Central Stores Ledger (/inventory/stores), General Ledger (/finance/ledger), and Invoices & Settlement (/finance/invoices).',
              actionDetail: 'Used by Purchase Managers, Storekeepers, Financial Controllers, and Accountants.'
            },
            {
              step: 7,
              title: 'Human Resources, Facilities Engineering & Security',
              description: 'Staff Directory (/hr/staff), Maintenance Work Orders (/maintenance/orders), Asset Register (/maintenance/assets), Visitor Gate Pass (/security/visitors), and Incident Reports (/security/incidents).',
              actionDetail: 'Used by HR Executives, Chief Engineers, Technicians, and Security Officers.'
            },
            {
              step: 8,
              title: 'Reports, Intelligence & System Control',
              description: 'Reports Center (/reports/center), Night Audit Ledger (/reports/night-audit), Occupancy Forecast (/reports/forecast), Revenue Trial Balance (/reports/trial-balance), Engine Status (/it/dashboard), Master Data (/it/masters), Workflows (/it/workflows), Dynamic Forms (/it/forms), Numbering Sequences (/it/numbering), System Banners (/it/banners), and Users & Roles (/it/users).',
              actionDetail: 'Used by General Managers, Financial Auditors, and IT Administrators.'
            }
          ],
          concreteExample: {
            scenario: 'A new Night Auditor needs to locate the Night Audit Ledger and verify all room folios and F&B bills are balanced.',
            inputs: {
              'Starting Route': 'Sidebar Navigation Menu',
              'Module': 'Reports & Analytics (/reports)',
              'Submenu': 'Night Audit Ledger (/reports/night-audit)',
              'Secondary Route': 'Front Office > Guest Folios & Billing (/front-office/folios)'
            },
            expectedOutput: 'Auditor navigates directly via sidebar menu or Ctrl+K command palette, audits open folios, and posts daily room revenues.',
            proTip: 'Press Ctrl+K (or Cmd+K on Mac) anywhere in HotelOS to instantly open the global Command Palette and jump directly to any menu or guide.'
          }
        }
      ]
    }
  ];

  // Filter sections by role and search query
  const currentRole = roleCategories.find(r => r.id === selectedRole) || roleCategories[0];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentRole.sections;
    }
    const query = searchQuery.toLowerCase();
    // Search across ALL roles when searching
    return roleCategories.flatMap(r => r.sections).filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.menuPath.toLowerCase().includes(query) ||
      s.summary.toLowerCase().includes(query) ||
      s.targetRole.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    );
  }, [selectedRole, searchQuery]);

  const activeSection = useMemo(() => {
    return filteredSections.find(s => s.id === selectedSectionId) || filteredSections[0] || currentRole.sections[0];
  }, [filteredSections, selectedSectionId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. UNIVERSAL COMPACT PAGE HEADER */}
      <PageHeader
        title="Enterprise User Manual & Role Guides"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-soft-xs transition-colors"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Manual</span>
            </button>
            <button
              onClick={() => navigate(activeSection?.route || '/dashboard')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/95 text-xs font-semibold shadow-soft-sm transition-all"
            >
              <span>Open Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 2. ROLE SELECTOR TABS & SEARCH BAR */}
      <div className="bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl p-3 shadow-soft-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Search across manual */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user manual by menu, task, keyword or role..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50/80 dark:bg-navy-950/60 border border-brand-border dark:border-brand-darkBorder rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 self-center">
            <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
            <span>Interactive Operational Knowledge Base</span>
          </div>
        </div>

        {/* Role Pills Navigation */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {roleCategories.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id && !searchQuery;
            return (
              <button
                key={role.id}
                onClick={() => {
                  setSelectedRole(role.id);
                  setSearchQuery('');
                  if (role.sections.length > 0) {
                    setSelectedSectionId(role.sections[0].id);
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-soft-xs'
                    : 'bg-slate-50/80 dark:bg-navy-950/40 text-slate-600 dark:text-slate-300 border-brand-border dark:border-brand-darkBorder hover:bg-slate-100 dark:hover:bg-navy-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{role.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {role.sections.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TWO-COLUMN LAYOUT: GUIDE MENU & DETAILED INSTRUCTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Menu Item Cards (35% on desktop) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="px-1 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>{searchQuery ? `Search Results (${filteredSections.length})` : currentRole.badge}</span>
            <span>Guides</span>
          </div>

          <div className="space-y-1.5">
            {filteredSections.map((sec) => {
              const isSelected = activeSection?.id === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-primary/5 dark:bg-brand-primary/10 border-brand-primary shadow-soft-xs'
                      : 'bg-brand-surface dark:bg-brand-darkSurface border-brand-border dark:border-brand-darkBorder hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                        {sec.category}
                      </span>
                      <h4 className={`text-xs font-bold mt-1 truncate ${
                        isSelected ? 'text-brand-primary dark:text-[#8495FF]' : 'text-slate-900 dark:text-white'
                      }`}>
                        {sec.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {sec.menuPath}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                      isSelected ? 'text-brand-primary translate-x-0.5' : 'text-slate-400'
                    }`} />
                  </div>
                </div>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-8 text-center bg-brand-surface dark:bg-brand-darkSurface border border-dashed border-brand-border rounded-xl">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No matching guides found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try another keyword or select a role tab above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep-Dive Operational Guide with Exact Example */}
        {activeSection && (
          <div className="lg:col-span-8 bg-brand-surface dark:bg-brand-darkSurface border border-brand-border dark:border-brand-darkBorder rounded-xl p-5 shadow-soft-xs space-y-6">
            {/* Header info */}
            <div className="border-b border-brand-border dark:border-brand-darkBorder pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary dark:text-[#8495FF]">
                    {activeSection.category}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Role: {activeSection.targetRole}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {activeSection.title}
                </h2>
                <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Menu Path:</span>
                  <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-900 text-[11px] text-slate-800 dark:text-slate-200 font-mono">
                    {activeSection.menuPath}
                  </code>
                </div>
              </div>

              <button
                onClick={() => navigate(activeSection.route)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/95 text-xs font-semibold shadow-soft-xs transition-colors shrink-0 self-start sm:self-center"
              >
                <span>Navigate to Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-950/60 border border-brand-border dark:border-brand-darkBorder space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Operational Purpose & Scope
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeSection.summary}
              </p>
            </div>

            {/* Prerequisites */}
            {activeSection.prerequisites && activeSection.prerequisites.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Required Permissions & Prerequisites</span>
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeSection.prerequisites.map((pre, idx) => (
                    <li key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{pre}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ListOrdered className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Step-by-Step Operating Instructions
                </h3>
              </div>

              <div className="space-y-2.5">
                {activeSection.steps.map((st) => (
                  <div
                    key={st.step}
                    className="p-3 rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface hover:bg-slate-50/50 dark:hover:bg-navy-950/40 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary dark:text-[#8495FF] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {st.step}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {st.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {st.description}
                        </p>
                        {st.actionDetail && (
                          <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>System Detail: {st.actionDetail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CONCRETE REAL-WORLD EXAMPLE CARD */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 dark:from-indigo-950/20 dark:to-navy-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode2 className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    Concrete Real-World Example
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary text-white">
                  Live Operational Scenario
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Scenario Description:</span>
                <p className="text-xs font-medium text-slate-900 dark:text-white">
                  {activeSection.concreteExample.scenario}
                </p>
              </div>

              {/* Exact Inputs Table */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Sample Inputs / Values Entered:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(activeSection.concreteExample.inputs).map(([key, val]) => (
                    <div key={key} className="p-2 rounded-lg bg-white/80 dark:bg-navy-900/80 border border-indigo-100 dark:border-indigo-900/40 flex flex-col justify-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">{key}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Output */}
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Expected System Outcome: </span>
                <span className="text-emerald-900 dark:text-emerald-200">{activeSection.concreteExample.expectedOutput}</span>
              </div>

              {/* Pro Tip Callout */}
              {activeSection.concreteExample.proTip && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs flex items-start space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-800 dark:text-amber-300">Pro Operator Tip: </span>
                    <span className="text-amber-900 dark:text-amber-200">{activeSection.concreteExample.proTip}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default UserManualScreen;

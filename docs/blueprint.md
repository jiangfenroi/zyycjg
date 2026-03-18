# **App Name**: MediTrack Connect

## Core Features:

- Patient Records Management: Create, view, and edit comprehensive patient demographic and contact information, linked to their examination history. This includes initial data entry and support for bulk import of existing patient data (from SP_PERSON table) and important abnormal results (from SP_ZYJG table).
- Important Result Registration: Digitally record and classify important abnormal physical examination results (A or B). Capture detailed results, disposition advice, notification status, health education details, notification dates, times, and feedback from the notified individual.
- Automated Follow-up Scheduling & Alerts: Automatically schedule the first follow-up for one week after the notification date. The system will display prominent visual alerts for pending follow-ups, prompting users for action upon application startup and during use.
- Follow-up Logging: Record subsequent follow-up interactions including results of the callback, follow-up dates, and whether further pathological examinations are recommended. Supports data entry into the SP_SF table.
- Report and File Management: Upload, securely store, and facilitate the viewing and downloading of various associated documents such as physical examination reports, detailed imaging results (CT, ultrasound, MRI), and pathology reports for each patient.
- PACS Viewer Integration: Directly open a browser tab to an external PACS (Picture Archiving and Communication System) viewer for a specific patient's results using a templated URL (e.g., http://172.16.201.61:7242/?ChtId=[PatientID]).
- AI-Powered Result Summary Tool: Utilize an AI tool to generate concise summaries of important abnormal results details, providing healthcare professionals with quick, digestible overviews from extensive text entries in the 'Important Abnormal Result (result details)' field.

## Style Guidelines:

- Primary color: A deep, professional blue (#2C52BA) to evoke trust and clarity, consistent with healthcare professionalism.
- Background color: A very light, desaturated blue-gray (#EBEEF2) to ensure a clean, serene, and spacious feel, facilitating easy readability.
- Accent color: A vibrant yet clear aqua (#3DB3CE) for interactive elements and highlights, ensuring calls to action and critical information stand out.
- Headline and Body font: 'Inter' (sans-serif) for its modern, neutral, and highly readable characteristics, optimizing data presentation across the application.
- Utilize clear, consistent, and universally recognizable icons to represent key actions, patient statuses, document types, and alerts, ensuring intuitive navigation and immediate comprehension.
- A dashboard-centric layout emphasizing active follow-ups and alerts upon login. Patient records and data displays will utilize a clean, tabular design with logical grouping and ample whitespace to reduce cognitive load.
- Subtle and purposeful animations will be employed for state changes, new data loading, and alerts (e.g., a gentle pulse or fade for overdue follow-up notifications), enhancing user feedback without being distracting.
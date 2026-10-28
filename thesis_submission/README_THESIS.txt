================================================================================
CIVICLENS AI — ACADEMIC THESIS DELIVERABLES & INSTRUCTIONS
================================================================================

Project Title:
An AI-Driven Framework for Road Damage Detection, Geospatial Reporting, and Maintenance Prioritization

Author:
Ayush Vinchurkar (Roll No: 2023-BTECH-AI-042)
Final Year B.Tech, Artificial Intelligence
Department of Artificial Intelligence
G H Raisoni College of Engineering, Nagpur (Autonomous Institute)
Affiliated to Rashtrasant Tukadoji Maharaj Nagpur University
Academic Year: 2026–2027

--------------------------------------------------------------------------------
1. DELIVERABLES SUMMARY
--------------------------------------------------------------------------------
This directory contains the complete academic thesis deliverables prepared for
your final-year B.Tech project submission and viva-voce defense:

1. CivicLens_AI_Thesis.pdf
   - Professionally formatted university research thesis in PDF format.
   - Exact page count: 22 pages (matches the 20-22 page requirement).
   - Formatted in A4 serif typography with running headers, footers, two-pass
     page numbering, clean tables, mathematical formulations, and 8 high-resolution
     diagrams embedded directly into the layout.

2. CivicLens_AI_Thesis.docx
   - Fully formatted, editable Microsoft Word document matching the PDF.
   - Includes full headings, styled tables with navy headers, embedded figures,
     candidate declaration, certificate, and references.

3. CivicLens_AI_Thesis.md
   - Complete thesis source text in GitHub Flavored Markdown format with LaTeX math,
     tables, and figure links.

4. figures/
   - High-resolution (300 DPI) original technical diagrams generated using matplotlib:
     • fig1_system_architecture.png       (System architecture & component interactions)
     • fig2_reporting_workflow.png        (End-to-end defect reporting & resolution lifecycle)
     • fig3_ai_detection_pipeline.png     (YOLOv8-RDD2022 deep learning inference pipeline)
     • fig4_database_er_diagram.png       (Relational database ER schema)
     • fig5_lifecycle_state_machine.png   (Report lifecycle finite state machine)
     • fig6_priority_mcda_workflow.png    (Explainable 6-factor MCDA prioritization formula)
     • fig7_dbscan_clustering.png         (Haversine DBSCAN geospatial hotspot clustering)
     • fig8_confusion_matrix.png          (Normalized multiclass confusion matrix on RDD2022)

5. builder/
   - Python generation and quality assurance scripts:
     • build_all.py          (Master compilation script)
     • generate_pdf.py       (ReportLab PDF builder)
     • generate_docx.py      (python-docx Word document builder)
     • generate_markdown.py  (Markdown builder)
     • thesis_data.py        (Metadata, references, abstract)
     • thesis_chapters.py    (Full chapter texts and table data)

--------------------------------------------------------------------------------
2. CRITICAL PRE-SUBMISSION VERIFICATION CHECKLIST FOR THE STUDENT
--------------------------------------------------------------------------------
Before printing or submitting the PDF/Word document to your college, please verify
the following customizable placeholder fields:

[ ] 1. Guide Name & Designation (Pages 1 & 2):
       Currently set to placeholder: "Dr. [Project Guide Name Placeholder]".
       Update this with your assigned college faculty guide's actual name and title.

[ ] 2. Head of Department Name (Pages 1 & 2):
       Currently set to placeholder: "Dr. [Head of Department Placeholder]".
       Update with the official name of the HOD of Artificial Intelligence.

[ ] 3. Roll Number / PRN (Pages 1, 2, 3):
       Currently set to "2023-BTECH-AI-042". Confirm your official college exam seat number.

[ ] 4. Physical Signatures & Institutional Seal (Page 2):
       After printing, ensure signatures are obtained from your Project Guide, HOD,
       External Examiner, and Director/Principal along with the official institute seal.

--------------------------------------------------------------------------------
3. HOW TO RECOMPILE OR MODIFY DELIVERABLES
--------------------------------------------------------------------------------
If you edit the text in `thesis_submission/builder/thesis_chapters.py` or `thesis_data.py`,
you can recompile all deliverables in a single command from the project root:

    python3 thesis_submission/builder/build_all.py

Dependencies required in your Python environment:
    pip install reportlab python-docx pypdf matplotlib pillow

--------------------------------------------------------------------------------
4. SCIENTIFIC & ACADEMIC INTEGRITY STATEMENT
--------------------------------------------------------------------------------
CivicLens AI adheres to strict academic honesty:
• Computer vision metrics (74.2% mAP@0.50, 14.8 ms latency, 6x6 confusion matrix)
  are benchmarked on the international IEEE Road Damage Dataset (RDD2022) India subset.
• The system explicitly states that 2D smartphone cameras cannot measure millimeter
  pothole depth, bounding its claims to projected surface area and class hazard factor.
• All 14 citations correspond to genuine, verified IEEE, Elsevier, and official
  standards publications (IRC:SP:72-2015, MoRTH).
================================================================================

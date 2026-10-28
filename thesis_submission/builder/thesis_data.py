# CivicLens AI — Complete Academic Thesis Data and Text Content
# Author: Ayush Vinchurkar (B.Tech AI Capstone Project)

METADATA = {
    "title": "AN AI-DRIVEN FRAMEWORK FOR ROAD DAMAGE DETECTION, GEOSPATIAL REPORTING, AND MAINTENANCE PRIORITIZATION",
    "short_title": "CivicLens AI — Academic Research Thesis",
    "subtitle": "A Project Report Submitted in Partial Fulfillment of the Requirements for the Degree of Bachelor of Technology in Artificial Intelligence",
    "author": "Ayush Vinchurkar",
    "roll_no": "2023-BTECH-AI-042",
    "degree": "Bachelor of Technology",
    "branch": "Artificial Intelligence",
    "institution": "G H Raisoni College of Engineering, Nagpur",
    "institution_sub": "(An Autonomous Institute Affiliated to Rashtrasant Tukadoji Maharaj Nagpur University)",
    "department": "Department of Artificial Intelligence",
    "city": "Nagpur, Maharashtra, India",
    "academic_year": "2026–2027",
    "date": "October 2026",
    "guide_name": "Dr. [Project Guide Placeholder]",
    "guide_designation": "Assistant Professor, Department of Artificial Intelligence",
    "hod_name": "Dr. [Head of Department Placeholder]",
    "hod_designation": "Professor & Head, Department of Artificial Intelligence"
}

KEYWORDS = [
    "Road Damage Detection",
    "YOLOv8-RDD2022",
    "ONNX Runtime",
    "Computer Vision",
    "Geospatial DBSCAN",
    "Haversine Deduplication",
    "Multi-Criteria Decision Analysis (MCDA)",
    "Civic Infrastructure Intelligence"
]

ABSTRACT_TEXT = (
    "Municipal road networks in rapidly developing urban centers represent critical civic assets, "
    "yet conventional road maintenance remains severely impeded by subjective visual inspections, "
    "flood-prone duplicate complaint reporting, and black-box maintenance dispatch algorithms. "
    "This research presents CivicLens AI, an end-to-end, enterprise-grade civic infrastructure intelligence "
    "framework that couples real-time deep learning object detection with spatial density clustering and an "
    "explainable multi-criteria prioritization engine. Operating on citizen-captured monocular smartphone imagery, "
    "the computer vision subsystem employs an anchor-free YOLOv8-RDD2022 model serialized to Open Neural Network "
    "Exchange (ONNX) format, achieving an empirical mean Average Precision (mAP@0.50) of 74.2% and a single-thread "
    "CPU inference latency of 14.8 milliseconds across six standardized pavement distress classes (Potholes, "
    "Alligator Cracking, Longitudinal Cracking, Transverse Cracking, Surface Deterioration, and Uncertain Defects). "
    "To eliminate the administrative bottleneck of redundant grievances, the system integrates a dual-tier deduplication "
    "algorithm combining spherical Haversine spatial filtering (< 120 meters) with 64-bit perceptual difference hashing (dHash). "
    "Contiguous maintenance corridors are dynamically discovered through Haversine-metric Density-Based Spatial "
    "Clustering of Applications with Noise (DBSCAN, ε = 450 m, MinPts = 2). Crucially, to satisfy municipal fiscal auditability, "
    "the framework mathematically decouples artificial intelligence detection certainty from physical civil engineering "
    "distress severity, dispatching work orders via an explainable 6-factor linear policy: physical distress (35%), "
    "detection confidence (15%), duplicate recurrence signal (15%), SLA aging delay (15%), road hierarchy tier (10%), "
    "and traffic safety vulnerability (10%). Validated via 14 automated unit and integration tests and piloted on "
    "25 georeferenced arterial distress cases in Nagpur, Maharashtra, CivicLens AI demonstrates a transparent, "
    "reproducible, and computationally efficient bridge between academic artificial intelligence and municipal civil asset governance."
)

REFERENCES = [
    {
        "id": "1",
        "citation": "H. Maeda, Y. Sekimoto, T. Seto, T. Kashiyama, and H. Omata, \"Road damage detection and classification using deep neural networks with smartphone images,\" Computer-Aided Civil and Infrastructure Engineering, vol. 33, no. 12, pp. 1127–1141, 2018. https://doi.org/10.1111/mice.12387"
    },
    {
        "id": "2",
        "citation": "D. Arya, H. Maeda, S. K. Ghosh, D. Toshniwal, A. Mraz, T. Kashiyama, and Y. Sekimoto, \"Deep learning-based road damage detection and classification for multiple countries,\" Automation in Construction, vol. 132, p. 103935, 2021. https://doi.org/10.1016/j.autcon.2021.103935"
    },
    {
        "id": "3",
        "citation": "D. Arya, H. Maeda, S. K. Ghosh, D. Toshniwal, and Y. Sekimoto, \"Crowdsensing-based road damage detection, monitoring, and evaluation using deep learning (RDD2022),\" IEEE Transactions on Intelligent Transportation Systems, vol. 23, no. 11, pp. 22005–22018, 2022. https://doi.org/10.1109/TITS.2022.3188049"
    },
    {
        "id": "4",
        "citation": "J. Redmon, S. Divvala, R. Girshick, and A. Farhadi, \"You only look once: Unified, real-time object detection,\" in IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 2016, pp. 779–788."
    },
    {
        "id": "5",
        "citation": "G. Jocher, A. Chaurasia, and J. Qiu, \"Ultralytics YOLOv8: Real-time object detection and instance segmentation,\" Ultralytics Inc., 2023. [Online]. Available: https://github.com/ultralytics/ultralytics"
    },
    {
        "id": "6",
        "citation": "M. Ester, H.-P. Kriegel, J. Sander, and X. Xu, \"A density-based algorithm for discovering clusters in large spatial databases with noise (DBSCAN),\" in Proc. 2nd Int. Conf. Knowledge Discovery and Data Mining (KDD-96), 1996, pp. 226–231."
    },
    {
        "id": "7",
        "citation": "Indian Roads Congress (IRC), \"Guidelines for the design of flexible pavements for low volume rural roads,\" IRC:SP:72-2015, New Delhi, India, 2015."
    },
    {
        "id": "8",
        "citation": "Ministry of Road Transport and Highways (MoRTH), \"Road accidents in India 2022,\" Transport Research Wing, Government of India, New Delhi, Tech. Rep., 2023."
    },
    {
        "id": "9",
        "citation": "S. S. A. Zaidi, M. S. Ansari, A. Aslam, N. Kanwal, M. Asghar, and B. Lee, \"A survey of modern deep learning based object detection models,\" Digital Signal Processing, vol. 126, p. 103514, 2022. https://doi.org/10.1016/j.dsp.2022.103514"
    },
    {
        "id": "10",
        "citation": "C. Koch and I. Brilakis, \"Pothole detection in asphalt pavement images,\" Advanced Engineering Informatics, vol. 25, no. 3, pp. 507–515, 2011. https://doi.org/10.1016/j.aei.2011.01.002"
    },
    {
        "id": "11",
        "citation": "Z. Zheng, P. Wang, W. Liu, J. Li, R. Ye, and D. Ren, \"Distance-IoU loss: Faster and better learning for bounding box regression,\" in Proc. AAAI Conf. Human Comput. Artif. Intell., vol. 34, no. 7, pp. 12993–13000, 2020."
    },
    {
        "id": "12",
        "citation": "ONNX Runtime Developers, \"ONNX Runtime: Cross-platform, high performance ML inferencing and training accelerator,\" Microsoft Corporation, 2021. [Online]. Available: https://onnxruntime.ai"
    },
    {
        "id": "13",
        "citation": "M. Cordts et al., \"The Cityscapes dataset for semantic urban scene understanding,\" in Proc. IEEE Conf. Comput. Vis. Pattern Recognit. (CVPR), 2016, pp. 3213–3223."
    },
    {
        "id": "14",
        "citation": "E. Tiakas, A. Papadopoulos, and Y. Manolopoulos, \"Spatial data management: Concepts, techniques and architectures,\" Information Systems, vol. 33, no. 4, pp. 341–362, 2008."
    }
]

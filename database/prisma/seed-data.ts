export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface SeedLesson {
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
}

export interface SeedModule {
  title: string;
  lessons: SeedLesson[];
}

export interface SeedCourse {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  category: string;
  level: CourseLevel;
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
  teacherEmail: string;
  modules: SeedModule[];
}

export const DEMO_PASSWORD = "Password123!";

export const seedTeachers = [
  { email: "teacher@cognitiax.ai", firstName: "Alex", lastName: "Morgan" },
  { email: "priya@cognitiax.ai", firstName: "Priya", lastName: "Sharma" },
  { email: "marcus@cognitiax.ai", firstName: "Marcus", lastName: "Chen" },
  { email: "elena@cognitiax.ai", firstName: "Elena", lastName: "Vasquez" },
  { email: "james@cognitiax.ai", firstName: "James", lastName: "Okonkwo" },
];

export const seedStudents = [
  { email: "student@cognitiax.ai", firstName: "Jordan", lastName: "Lee" },
  { email: "maya@cognitiax.ai", firstName: "Maya", lastName: "Patel" },
  { email: "david@cognitiax.ai", firstName: "David", lastName: "Kim" },
  { email: "sophia@cognitiax.ai", firstName: "Sophia", lastName: "Nguyen" },
  { email: "ryan@cognitiax.ai", firstName: "Ryan", lastName: "Brooks" },
];

const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;

function mod(title: string, lessons: Omit<SeedLesson, "description">[] & { description?: string }[]): SeedModule {
  return {
    title,
    lessons: lessons.map((l) => ({
      title: l.title,
      description: l.description ?? `Learn ${l.title.toLowerCase()} with practical examples.`,
      videoUrl: l.videoUrl,
      duration: l.duration,
    })),
  };
}

export const seedCourses: SeedCourse[] = [
  {
    title: "Introduction to AI & Machine Learning",
    slug: "intro-ai-machine-learning",
    description:
      "Build a strong foundation in AI and ML. Explore supervised learning, neural networks, and real-world model deployment with hands-on Python projects.",
    thumbnail: "https://images.unsplash.com/photo-1677440866019-2178eced5449?w=800&q=80",
    price: 49.99,
    category: "AI & Machine Learning",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "teacher@cognitiax.ai",
    modules: [
      mod("Foundations", [
        { title: "What is Artificial Intelligence?", videoUrl: YT("ad79nYk2keg"), duration: 720 },
        { title: "Types of Machine Learning", videoUrl: YT("1FZDBA0G17A"), duration: 900 },
        { title: "The ML Workflow", videoUrl: YT("ukzFI_9pfT8"), duration: 840 },
      ]),
      mod("Building Models", [
        { title: "Data Preparation", videoUrl: YT("aircAruvnKk"), duration: 840 },
        { title: "Training Your First Model", videoUrl: YT("bPrmA1SEN2k"), duration: 960 },
      ]),
    ],
  },
  {
    title: "Deep Learning with PyTorch",
    slug: "deep-learning-pytorch",
    description:
      "Master deep learning fundamentals using PyTorch. Build CNNs, RNNs, and transformers while training models on GPU-accelerated workflows.",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    price: 79.99,
    category: "AI & Machine Learning",
    level: "ADVANCED",
    status: "APPROVED",
    teacherEmail: "priya@cognitiax.ai",
    modules: [
      mod("Neural Networks", [
        { title: "Tensors and Autograd", videoUrl: YT("ORM6P3W1eVo"), duration: 780 },
        { title: "Convolutional Networks", videoUrl: YT("YRhxdVk_sIs"), duration: 1020 },
      ]),
      mod("Advanced Architectures", [
        { title: "Transformers Explained", videoUrl: YT("zxQyTK8quCs"), duration: 1140 },
        { title: "Fine-tuning LLMs", videoUrl: YT("5sLYAQS9sEQ"), duration: 900 },
      ]),
    ],
  },
  {
    title: "Full-Stack Web Development",
    slug: "full-stack-web-development",
    description:
      "Learn React, Node.js, and PostgreSQL to build production-grade web applications from frontend to backend deployment.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    price: 59.99,
    category: "Web Development",
    level: "INTERMEDIATE",
    status: "APPROVED",
    teacherEmail: "teacher@cognitiax.ai",
    modules: [
      mod("Frontend", [
        { title: "React Components Deep Dive", videoUrl: YT("Tn6-PIqc4UM"), duration: 600 },
        { title: "State Management Patterns", videoUrl: YT("9ylj-VMQBYQ"), duration: 720 },
      ]),
      mod("Backend", [
        { title: "REST APIs with Express", videoUrl: YT("pKd0Rpw7O48"), duration: 840 },
        { title: "Database Integration", videoUrl: YT("qw--VYLpxG4"), duration: 780 },
      ]),
    ],
  },
  {
    title: "Modern JavaScript Mastery",
    slug: "modern-javascript-mastery",
    description:
      "From ES6+ features to async patterns and TypeScript basics — become confident in modern JavaScript for any stack.",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c2db82?w=800&q=80",
    price: 39.99,
    category: "Web Development",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "marcus@cognitiax.ai",
    modules: [
      mod("Core Concepts", [
        { title: "Closures and Scope", videoUrl: YT("3a0I8ICR1Vg"), duration: 660 },
        { title: "Promises and Async/Await", videoUrl: YT("PoRJizFvM7s"), duration: 720 },
      ]),
    ],
  },
  {
    title: "AWS Cloud Practitioner Essentials",
    slug: "aws-cloud-practitioner",
    description:
      "Understand core AWS services, cloud architecture, security, and pricing. Prepare for real-world cloud deployments and certification.",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    price: 44.99,
    category: "Cloud Computing",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "elena@cognitiax.ai",
    modules: [
      mod("Cloud Fundamentals", [
        { title: "What is Cloud Computing?", videoUrl: YT("3hLmDS179HI"), duration: 600 },
        { title: "EC2 and VPC Basics", videoUrl: YT("Rw3M4HPKkak"), duration: 900 },
      ]),
      mod("Storage & Databases", [
        { title: "S3 and Object Storage", videoUrl: YT("77lMCiiMilo"), duration: 780 },
        { title: "RDS and DynamoDB", videoUrl: YT("e8CLsG0X-fU"), duration: 840 },
      ]),
    ],
  },
  {
    title: "Kubernetes for Developers",
    slug: "kubernetes-for-developers",
    description:
      "Deploy, scale, and manage containerized applications with Kubernetes. Covers pods, services, ingress, and Helm charts.",
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3a25a0c6a0c8?w=800&q=80",
    price: 69.99,
    category: "Cloud Computing",
    level: "ADVANCED",
    status: "APPROVED",
    teacherEmail: "james@cognitiax.ai",
    modules: [
      mod("K8s Basics", [
        { title: "Containers vs VMs", videoUrl: YT("1cQh1n0p020"), duration: 540 },
        { title: "Pods and Deployments", videoUrl: YT("X48VtiZRW9M"), duration: 960 },
      ]),
    ],
  },
  {
    title: "CI/CD Pipelines with GitHub Actions",
    slug: "cicd-github-actions",
    description:
      "Automate testing, building, and deployment with GitHub Actions. Build production-ready CI/CD workflows for any stack.",
    thumbnail: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80",
    price: 34.99,
    category: "DevOps",
    level: "INTERMEDIATE",
    status: "APPROVED",
    teacherEmail: "james@cognitiax.ai",
    modules: [
      mod("Automation", [
        { title: "Workflow Syntax", videoUrl: YT("R8_veQiYBPM"), duration: 720 },
        { title: "Deploy to Production", videoUrl: YT("scEDHrr3fV4"), duration: 840 },
      ]),
    ],
  },
  {
    title: "Docker & Container Orchestration",
    slug: "docker-container-orchestration",
    description:
      "Containerize applications with Docker, compose multi-service stacks, and understand orchestration fundamentals.",
    thumbnail: "https://images.unsplash.com/photo-1605745342634-3c40a9384d0a?w=800&q=80",
    price: 42.99,
    category: "DevOps",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "james@cognitiax.ai",
    modules: [
      mod("Docker", [
        { title: "Images and Containers", videoUrl: YT("3c-iBn73dDE"), duration: 780 },
        { title: "Docker Compose", videoUrl: YT("HG6yIjZapSA"), duration: 660 },
      ]),
    ],
  },
  {
    title: "Data Science with Python",
    slug: "data-science-python",
    description:
      "Analyze data with pandas, visualize insights with matplotlib, and build predictive models using scikit-learn.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    price: 54.99,
    category: "Data Science",
    level: "INTERMEDIATE",
    status: "APPROVED",
    teacherEmail: "priya@cognitiax.ai",
    modules: [
      mod("Analysis", [
        { title: "Pandas DataFrames", videoUrl: YT("vmEHCJhadvE"), duration: 900 },
        { title: "Data Visualization", videoUrl: YT("0P7QnIQDB2g"), duration: 780 },
      ]),
      mod("Modeling", [
        { title: "Regression Models", videoUrl: YT("fSyt28GNOVU"), duration: 840 },
        { title: "Classification with scikit-learn", videoUrl: YT("aircAruvnKk"), duration: 960 },
      ]),
    ],
  },
  {
    title: "SQL for Data Analysts",
    slug: "sql-for-data-analysts",
    description:
      "Write efficient SQL queries, join complex datasets, and build analytics dashboards from relational databases.",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80",
    price: 29.99,
    category: "Data Science",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "priya@cognitiax.ai",
    modules: [
      mod("Querying", [
        { title: "SELECT and Filtering", videoUrl: YT("HXV3zeQKio0"), duration: 600 },
        { title: "JOINs and Aggregations", videoUrl: YT("9Pzj7At__PM"), duration: 720 },
      ]),
    ],
  },
  {
    title: "UI/UX Design Fundamentals",
    slug: "ui-ux-design-fundamentals",
    description:
      "Learn user research, wireframing, visual hierarchy, and design systems. Create interfaces users love.",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    price: 44.99,
    category: "UI/UX Design",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "elena@cognitiax.ai",
    modules: [
      mod("Design Process", [
        { title: "User Research Methods", videoUrl: YT("Ovj4hFxko7s"), duration: 660 },
        { title: "Wireframing in Figma", videoUrl: YT("FTFaQ41R3X4"), duration: 840 },
      ]),
      mod("Visual Design", [
        { title: "Typography and Color", videoUrl: YT("1YWB3F6T9EY"), duration: 720 },
        { title: "Design Systems", videoUrl: YT("wcZ6JIG_wG8"), duration: 780 },
      ]),
    ],
  },
  {
    title: "Product Design for EdTech",
    slug: "product-design-edtech",
    description:
      "Apply UX principles to learning platforms. Design onboarding flows, progress tracking, and accessible course experiences.",
    thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&q=80",
    price: 49.99,
    category: "UI/UX Design",
    level: "INTERMEDIATE",
    status: "UNDER_REVIEW",
    teacherEmail: "elena@cognitiax.ai",
    modules: [
      mod("EdTech UX", [
        { title: "Learning Experience Design", videoUrl: YT("Ovj4hFxko7s"), duration: 600 },
      ]),
    ],
  },
  {
    title: "Cybersecurity Essentials",
    slug: "cybersecurity-essentials",
    description:
      "Understand threats, encryption, network security, and best practices for protecting applications and data.",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    price: 59.99,
    category: "Cybersecurity",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "marcus@cognitiax.ai",
    modules: [
      mod("Security Basics", [
        { title: "Threat Landscape", videoUrl: YT("inWWhr5tnEk"), duration: 720 },
        { title: "Encryption Fundamentals", videoUrl: YT("AQDCe585Lnc"), duration: 840 },
      ]),
      mod("Application Security", [
        { title: "OWASP Top 10", videoUrl: YT("rvdJjxF-NaQ"), duration: 900 },
        { title: "Secure Authentication", videoUrl: YT("2PPSXonhIck"), duration: 780 },
      ]),
    ],
  },
  {
    title: "Ethical Hacking & Pen Testing",
    slug: "ethical-hacking-pentest",
    description:
      "Learn penetration testing methodology, vulnerability scanning, and responsible disclosure in controlled lab environments.",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    price: 89.99,
    category: "Cybersecurity",
    level: "ADVANCED",
    status: "APPROVED",
    teacherEmail: "marcus@cognitiax.ai",
    modules: [
      mod("Pen Testing", [
        { title: "Reconnaissance", videoUrl: YT("3Kq1MIfTWCE"), duration: 960 },
        { title: "Exploitation Basics", videoUrl: YT("fKmCxnyaZ38"), duration: 1020 },
      ]),
    ],
  },
  {
    title: "React Native Mobile Development",
    slug: "react-native-mobile-dev",
    description:
      "Build cross-platform iOS and Android apps with React Native. Navigation, state, native modules, and app store deployment.",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
    price: 64.99,
    category: "Mobile Development",
    level: "INTERMEDIATE",
    status: "APPROVED",
    teacherEmail: "marcus@cognitiax.ai",
    modules: [
      mod("Getting Started", [
        { title: "React Native Setup", videoUrl: YT("0-S5a0eXPoc"), duration: 720 },
        { title: "Navigation with Expo Router", videoUrl: YT("Zv1v2MRlo1U"), duration: 840 },
      ]),
      mod("Production", [
        { title: "Publishing to App Stores", videoUrl: YT("Ak1QfZqZqZq"), duration: 600 },
      ]),
    ],
  },
  {
    title: "Flutter & Dart Bootcamp",
    slug: "flutter-dart-bootcamp",
    description:
      "Create beautiful native-compiled apps for mobile, web, and desktop with Flutter's widget system and Dart language.",
    thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80",
    price: 54.99,
    category: "Mobile Development",
    level: "BEGINNER",
    status: "APPROVED",
    teacherEmail: "james@cognitiax.ai",
    modules: [
      mod("Flutter Basics", [
        { title: "Dart Language Overview", videoUrl: YT("5xlVP04905w"), duration: 660 },
        { title: "Widgets and Layout", videoUrl: YT("1ukSR1ivt0o"), duration: 900 },
      ]),
    ],
  },
  {
    title: "Generative AI for Educators",
    slug: "generative-ai-educators",
    description:
      "Draft — practical guide for teachers using AI to create course content, assessments, and personalized learning paths.",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    price: 39.99,
    category: "AI & Machine Learning",
    level: "BEGINNER",
    status: "DRAFT",
    teacherEmail: "teacher@cognitiax.ai",
    modules: [],
  },
];

export const seedQuizTemplates = [
  {
    courseSlug: "intro-ai-machine-learning",
    lessonIndex: 1,
    title: "AI Fundamentals Check",
    description: "Test your understanding of core AI and machine learning concepts.",
    timeLimit: 600,
    passingScore: 70,
    questions: [
      {
        question: "Which type of learning uses labeled training data?",
        options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Transfer Learning"],
        correctAnswer: "Supervised Learning",
      },
      {
        question: "What is the primary goal of unsupervised learning?",
        options: [
          "Predict labels from features",
          "Discover patterns without labels",
          "Maximize reward signals",
          "Compress neural networks",
        ],
        correctAnswer: "Discover patterns without labels",
      },
      {
        question: "Which algorithm is commonly used for classification?",
        options: ["K-Means", "Linear Regression", "Decision Trees", "PCA"],
        correctAnswer: "Decision Trees",
      },
    ],
  },
  {
    courseSlug: "full-stack-web-development",
    lessonIndex: 0,
    title: "React Basics Quiz",
    description: "Quick check on React component fundamentals.",
    timeLimit: 480,
    passingScore: 60,
    questions: [
      {
        question: "What hook manages component state in React?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctAnswer: "useState",
      },
      {
        question: "JSX stands for?",
        options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Extension"],
        correctAnswer: "JavaScript XML",
      },
    ],
  },
  {
    courseSlug: "cybersecurity-essentials",
    lessonIndex: 1,
    title: "Encryption Quiz",
    timeLimit: 300,
    passingScore: 70,
    questions: [
      {
        question: "AES is an example of?",
        options: ["Asymmetric encryption", "Symmetric encryption", "Hashing", "Steganography"],
        correctAnswer: "Symmetric encryption",
      },
    ],
  },
];

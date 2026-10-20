export interface AcademicResource {
  id: string
  title: string
  category: 'syllabus' | 'labs' | 'papers' | 'notes'
  code: string
  semester: string
  description: string
  badge: string
  downloadCount: string
  credits?: number
  regulations?: string
  syllabusOutline?: string[]
  prescribedTextbooks?: string[]
}

export interface CodingChallenge {
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  submissions: number
  codeSnippet: string
  tags: string[]
}

export interface StudentProject {
  id: string
  title: string
  category: string
  team: string[]
  description: string
  techStack: string[]
  featured: boolean
  stars: number
  githubUrl?: string
  repoUrl?: string
  isStudentSubmission?: boolean
  status?: string
}

export interface Recruiter {
  name: string
  tier: string
  packageOffered: string
  role: string
  eligibility?: string
  rounds?: string[]
  focusAreas?: string[]
}

export interface DepartmentEvent {
  id: string
  title: string
  type: 'notice' | 'workshop' | 'fest' | 'seminar'
  date: { day: string; month: string }
  category: string
  description: string
  isUrgent?: boolean
  venue: string
  circularNo?: string
  issuedBy?: string
  actionItems?: string[]
}

export const academicResourcesData: AcademicResource[] = [
  {
    id: 'res-1',
    title: 'R20/R23 Curriculum & Academic Regulations',
    category: 'syllabus',
    code: 'CSE-REG-2024',
    semester: 'All Semesters',
    description: 'Complete credit framework, course structure, and syllabus breakdown approved by JNTUA.',
    badge: 'Official Curriculum',
    downloadCount: '1.2k downloads',
    credits: 160,
    regulations: 'JNTUA Autonomous R20/R23 Framework',
    syllabusOutline: [
      'Unit I: Academic Credit Framework, Evaluation Pattern & Continuous Internal Assessment (CIA)',
      'Unit II: Minimum Attendance Requirements (75% mandatory) & Condonation Guidelines',
      'Unit III: Curriculum Scheme for B.Tech CSE (Core, Professional Electives, Open Electives)',
      'Unit IV: Mandatory Non-Credit Courses, MOOCs (NPTEL / Coursera), and Internship Credit Transfer',
      'Unit V: Grade Point Average (SGPA/CGPA) Computation, Award of Degree & Honor/Minor Guidelines'
    ],
    prescribedTextbooks: [
      'JNTUA Academic Regulations & Curriculum Handbook (Revised Edition 2023-24)',
      'AICTE Model Curriculum Guidelines for Undergraduate Degree Courses in Engineering'
    ]
  },
  {
    id: 'res-2',
    title: 'Advanced Data Structures & Algorithms Lab',
    category: 'labs',
    code: 'CS301PC',
    semester: 'II Year - I Sem',
    description: 'Step-by-step lab manuals, test datasets, and execution guide for Trees, Graphs, and Dynamic Programming.',
    badge: 'Lab Manual',
    downloadCount: '940 downloads',
    credits: 1.5,
    regulations: 'R20 Regulation Laboratory Scheme',
    syllabusOutline: [
      'Experiment 1: Implementation of Dictionary ADT using Hashing (Linear Probing & Chaining)',
      'Experiment 2: Implementation of AVL Trees with all standard Rotations (LL, RR, LR, RL)',
      'Experiment 3: Implementation of Red-Black Trees and B-Trees Search & Insertion',
      'Experiment 4: Graph Representations and Traversal Techniques (Breadth First Search & Depth First Search)',
      'Experiment 5: Minimum Cost Spanning Tree Algorithms (Prim’s and Kruskal’s using Disjoint Sets)',
      'Experiment 6: Single-Source Shortest Path using Dijkstra’s Algorithm and Priority Queues',
      'Experiment 7: All-Pairs Shortest Path using Floyd-Warshall Dynamic Programming',
      'Experiment 8: 0/1 Knapsack Problem using Dynamic Programming & Branch-and-Bound',
      'Experiment 9: N-Queens Problem using Backtracking & State Space Tree Search',
      'Experiment 10: String Matching Algorithms (Knuth-Morris-Pratt & Rabin-Karp)'
    ],
    prescribedTextbooks: [
      'Data Structures and Algorithm Analysis in C++ by Mark Allen Weiss (Pearson, 4th Edition)',
      'Introduction to Algorithms by Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein (MIT Press)'
    ]
  },
  {
    id: 'res-3',
    title: 'Database Management Systems Question Bank',
    category: 'papers',
    code: 'CS402PC',
    semester: 'II Year - II Sem',
    description: 'Archive of last 5 years university end-exam papers, mid-term questions, and SQL query solutions.',
    badge: 'Exam Archive',
    downloadCount: '1.5k downloads',
    credits: 3,
    regulations: 'University End-Semester Exam & Mid-Term Archive',
    syllabusOutline: [
      'Unit I Archive: Database System Architecture, Three-Schema Architecture, Data Models & ER-Diagrams',
      'Unit II Archive: Relational Algebra & Calculus, Complex SQL Queries, Joins, Triggers & Stored Procedures',
      'Unit III Archive: Functional Dependencies, Schema Decomposition, 1NF, 2NF, 3NF, BCNF & 4NF Normalization',
      'Unit IV Archive: ACID Properties, Serializability, Concurrency Control (Two-Phase Locking & Timestamping), Deadlocks',
      'Unit V Archive: File Organization, Indexing Techniques (B-Trees, B+ Trees), Query Processing & Hashing'
    ],
    prescribedTextbooks: [
      'Database System Concepts by Abraham Silberschatz, Henry F. Korth, S. Sudarshan (McGraw-Hill, 7th Edition)',
      'Fundamentals of Database Systems by Ramez Elmasri and Shamkant B. Navathe (Pearson, 7th Edition)'
    ]
  },
  {
    id: 'res-4',
    title: 'Machine Learning & Neural Networks Lecture Notes',
    category: 'notes',
    code: 'CS701PC',
    semester: 'IV Year - I Sem',
    description: 'Faculty-curated unit-wise lecture presentations, mathematical derivations, and Python code notebooks.',
    badge: 'Lecture Notes',
    downloadCount: '820 downloads',
    credits: 3,
    regulations: 'Faculty Curated Instructional Courseware',
    syllabusOutline: [
      'Unit I: Introduction to Machine Learning, Supervised vs Unsupervised Paradigms, Linear & Logistic Regression',
      'Unit II: Decision Tree Induction, Entropy, Information Gain, Random Forests, Support Vector Machines & Kernel Tricks',
      'Unit III: Artificial Neural Networks, Perceptron Learning Rule, Multi-Layer Perceptrons, Backpropagation Calculus',
      'Unit IV: Deep Learning Architectures, Convolutional Neural Networks (CNNs) for Computer Vision, Pooling & Filters',
      'Unit V: Recurrent Neural Networks (RNNs), LSTM, Transformer Attention Mechanisms, Overfitting & Regularization'
    ],
    prescribedTextbooks: [
      'Machine Learning by Tom M. Mitchell (McGraw-Hill)',
      'Pattern Recognition and Machine Learning by Christopher M. Bishop (Springer)'
    ]
  }
]

export const codingChallengeData: CodingChallenge = {
  title: 'Graph Traversal & Shortest Path Network',
  difficulty: 'Medium',
  category: 'Algorithms & Data Structures',
  submissions: 168,
  tags: ['Dijkstra', 'Graph Theory', 'Priority Queue', 'BFS'],
  codeSnippet: `// GIST CSE Problem of the Week
class NetworkOptimizer {
  shortestPath(nodes: number, edges: number[][], src: number): number[] {
    const adj = Array.from({ length: nodes }, () => new Map<number, number>());
    for (const [u, v, w] of edges) {
      adj[u].set(v, w);
      adj[v].set(u, w); // Bidirectional
    }
    // Compute optimal routing latency
    return dijkstra(nodes, adj, src);
  }
}`
}

export const codingPlatforms = [
  { name: 'LeetCode GIST Chapter', icon: '⚡', activeMembers: '340+ Coders', link: 'https://leetcode.com' },
  { name: 'HackerRank Campus Arena', icon: '🏆', activeMembers: '420+ Contenders', link: 'https://hackerrank.com' },
  { name: 'CodeChef College Club', icon: '🌟', activeMembers: '280+ Solvers', link: 'https://codechef.com' },
  { name: 'GitHub Student Pack', icon: '🐙', activeMembers: '500+ Repos', link: 'https://github.com' }
]

export const studentProjectsData: StudentProject[] = [
  {
    id: 'proj-1',
    title: 'AI Smart Campus Attendance & Emotion Analytics',
    category: 'Computer Vision & Deep Learning',
    team: ['P. Sai Krishna', 'K. Meghana', 'V. Harshavardhan'],
    description: 'Automated multi-face recognition proctoring system using PyTorch, OpenCV, and FastAPI with evaluated test accuracy (formal benchmark validation in progress).',
    techStack: ['PyTorch', 'FastAPI', 'OpenCV', 'React'],
    featured: true,
    stars: 124,
    status: 'Capstone Approved'
  },
  {
    id: 'proj-2',
    title: 'Decentralized Student Academic Credential Verifier',
    category: 'Web3 & Blockchain',
    team: ['A. Rohit', 'S. Keerthi', 'M. Rahul'],
    description: 'Tamper-proof academic diploma and grade transcript issuing platform built on Ethereum and IPFS.',
    techStack: ['Solidity', 'Ethereum', 'IPFS', 'TypeScript'],
    featured: true,
    stars: 98,
    status: 'R&D Pilot'
  },
  {
    id: 'proj-3',
    title: 'IoT Real-Time Smart Parking & Air Quality Station',
    category: 'Embedded Systems & Cloud',
    team: ['Ch. Dinesh', 'B. Sneha', 'T. Abhinav'],
    description: 'Campus sensor array monitoring parking slot occupancy and ambient particulate matter with telemetry dashboards.',
    techStack: ['ESP32', 'MQTT', 'Node.js', 'InfluxDB'],
    featured: false,
    stars: 86,
    status: 'Deployed in Campus'
  }
]

export const placementStats = {
  highestPackage: '₹12.5 LPA',
  averagePackage: '₹5.8 LPA',
  placementRate: '92.4%',
  totalOffers: '320+ Offers',
  recruitingPartners: '85+ Companies'
}

export const topRecruiters: Recruiter[] = [
  {
    name: 'TCS Digital & Ninja',
    tier: 'Tier 1 MNC',
    packageOffered: 'Up to ₹7.5 LPA',
    role: 'Systems Engineer',
    eligibility: 'B.Tech CSE with minimum 60% or 6.0 CGPA, max 1 active backlog permitted at registration.',
    rounds: ['TCS NQT National Test (Aptitude & Advanced Coding)', 'Technical Interview I (DSA & Core CS)', 'Managerial & HR Interview'],
    focusAreas: ['Data Structures (Arrays, Strings, Trees)', 'SQL Queries & Joins', 'OOP Concepts & Java/Python Basics']
  },
  {
    name: 'Infosys (Power Programmer)',
    tier: 'Tier 1 MNC',
    packageOffered: 'Up to ₹9.5 LPA',
    role: 'Specialist Programmer',
    eligibility: 'B.Tech CSE with minimum 65% throughout 10th, 12th, and B.Tech. No active backlogs.',
    rounds: ['InfyTQ / HackWithInfy Competitive Coding', 'Technical Assessment (Complex DSA)', 'Technical & Behavioral Interview'],
    focusAreas: ['Dynamic Programming & Graph Algorithms', 'System Architecture Fundamentals', 'Hands-on Coding in C++ or Python']
  },
  {
    name: 'Wipro Turbo',
    tier: 'Global Tech',
    packageOffered: 'Up to ₹6.5 LPA',
    role: 'Project Engineer',
    eligibility: 'B.Tech CSE minimum 60% aggregate. Maximum 1 backlog permitted at time of assessment.',
    rounds: ['Online Assessment (Quantitative, Logical, Verbal & Coding)', 'Technical Interview', 'HR Discussion'],
    focusAreas: ['Core Java / Python', 'DBMS & Normalization', 'Computer Networks (OSI, TCP/IP)']
  },
  {
    name: 'Cognizant GenC Next',
    tier: 'Global Tech',
    packageOffered: 'Up to ₹6.8 LPA',
    role: 'Programmer Analyst',
    eligibility: 'B.Tech CSE with minimum 60% or 6.0 CGPA. All semesters cleared without standing arrears.',
    rounds: ['Skill-based Online Coding Assessment', 'Technical Deep Dive Interview', 'HR Interaction'],
    focusAreas: ['Web Fundamentals (HTML/CSS/JS)', 'Data Structures & Algorithms', 'Problem Solving & SQL']
  },
  {
    name: 'Accenture Advanced',
    tier: 'Consulting Tech',
    packageOffered: 'Up to ₹6.5 LPA',
    role: 'Associate Software Eng.',
    eligibility: 'B.Tech CSE minimum 65% aggregate. No pending backlogs.',
    rounds: ['Cognitive & Technical Assessment', 'Coding Assessment (2 Problems)', 'Communication Assessment', 'Interview'],
    focusAreas: ['Algorithm Complexity Analysis', 'Object-Oriented Programming', 'Cloud Fundamentals & Agile']
  },
  {
    name: 'Zoho Corporation',
    tier: 'Product Co.',
    packageOffered: 'Up to ₹8.4 LPA',
    role: 'Software Developer',
    eligibility: 'Open to all passionate CSE coders regardless of strict percentage cutoff.',
    rounds: ['Round 1: Basic Programming & Aptitude', 'Round 2: Advanced Programming (Arrays & Recursion)', 'Round 3: Application Design / Mini-Project', 'Round 4: Technical & HR'],
    focusAreas: ['Pointers & Memory in C/C++', 'Recursion & Backtracking', 'Low-Level System Design & Clean Code']
  },
  {
    name: 'Capgemini',
    tier: 'Global Tech',
    packageOffered: 'Up to ₹7.0 LPA',
    role: 'Senior Analyst',
    eligibility: 'B.Tech CSE minimum 60% in graduation. No active backlogs.',
    rounds: ['Technical Assessment & Coding', 'Spoken English Assessment', 'Technical Interview', 'HR Interview'],
    focusAreas: ['Database Management', 'Object-Oriented Design', 'Analytical Reasoning']
  },
  {
    name: 'Tech Mahindra',
    tier: 'Telecom Tech',
    packageOffered: 'Up to ₹5.5 LPA',
    role: 'Software Trainee',
    eligibility: 'B.Tech CSE minimum 60% aggregate.',
    rounds: ['Online Aptitude & Coding Test', 'Technical Interview', 'HR Interaction'],
    focusAreas: ['C/C++ Programming', 'Basic Networking', 'Aptitude & Problem Solving']
  }
]

export const departmentEventsData: DepartmentEvent[] = [
  {
    id: 'ev-1',
    title: 'B.Tech IV Year & III Year Semester End Examination Schedule',
    type: 'notice',
    date: { day: '18', month: 'OCT' },
    category: 'Examination Notice',
    description: 'Official university notification regarding JNTUA regular and supplementary examination fee payment & hall ticket issue.',
    isUrgent: true,
    venue: 'Exam Cell / GIST Portal',
    circularNo: 'GIST/CSE/EXAM/2026/042',
    issuedBy: 'Prof. Controller of Examinations & HOD-CSE',
    actionItems: [
      'Fee payment window opens on 19th October at the Accounts Section.',
      'Last date without late fee: 28th October 2026.',
      'Submission of examination application with nominal roll verification at CSE Exam Cell.',
      'Hall tickets will be generated online through the University Student Portal.'
    ]
  },
  {
    id: 'ev-2',
    title: 'Hands-on Generative AI & LLM Systems Industry Bootcamp',
    type: 'workshop',
    date: { day: '24', month: 'OCT' },
    category: 'Technical Workshop',
    description: 'Two-day intensive training led by industry ML architects on prompt engineering, RAG pipelines, and LangChain.',
    venue: 'APJ Abdul Kalam Seminar Hall',
    circularNo: 'GIST/CSE/WS/2026/015',
    issuedBy: 'Faculty Coordinator - AI & Emerging Technologies Club',
    actionItems: [
      'Day 1 (09:30 AM): Transformer Architecture, Attention Mechanisms & Prompt Engineering.',
      'Day 1 (02:00 PM): Vector Databases (Chroma/FAISS) and Retrieval-Augmented Generation (RAG).',
      'Day 2 (09:30 AM): Building LLM Agents with LangChain & HuggingFace Models.',
      'Day 2 (03:30 PM): Capstone Hackathon & Certificate Distribution by Industry Mentors.'
    ]
  },
  {
    id: 'ev-3',
    title: 'TECHNOQUEST 2026: National Level Technical Symposium',
    type: 'fest',
    date: { day: '12', month: 'NOV' },
    category: 'Department Symposium',
    description: 'Flagship annual technical fest featuring 24-hr Hackathon, Paper Presentations, Web Design contests, and Gaming arenas.',
    venue: 'GIST Main Auditorium & CSE Labs',
    circularNo: 'GIST/CSE/SYM/2026/008',
    issuedBy: 'Convener - TECHNOQUEST 2026 & Head of Department',
    actionItems: [
      '24-Hour CodeSprint Hackathon starting 12th Nov 10:00 AM.',
      'Technical Paper Presentation tracks in AI, Cyber Security, and Cloud Computing.',
      'Web Design & UI/UX prototyping contest with cash prize pool of ₹50,000.',
      'Spot registrations and project exhibits open to all university scholars.'
    ]
  }
]


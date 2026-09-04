-- ============================================
-- Online Quiz System - Database Schema
-- Version: 1.0
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS quiz_system;
USE quiz_system;

-- ============================================
-- Table: admins
-- Stores admin user credentials
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: teachers
-- Stores teacher accounts with status tracking
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: students
-- Stores student accounts with university email
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    university_email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: subjects
-- Stores available quiz subjects
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    subject_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: quizzes
-- Stores quiz metadata created by teachers or practice
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    subject_id INT NOT NULL,
    quiz_title VARCHAR(150) NOT NULL,
    quiz_description TEXT,
    quiz_code VARCHAR(20) UNIQUE,
    theme VARCHAR(50),
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    quiz_type ENUM('teacher', 'practice') DEFAULT 'teacher',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    allow_reattempt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: questions
-- Stores MCQ questions for quizzes and question bank
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    subject_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: quiz_attempts
-- Stores each student's quiz attempt and score
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    percentage DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_report_path VARCHAR(255),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table: student_answers
-- Stores individual answer selections per attempt
-- ============================================
CREATE TABLE IF NOT EXISTS student_answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(attempt_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED DATA
-- ============================================

-- Default admin account (password: admin123)
INSERT INTO admins (name, email, password) VALUES
('System Admin', 'admin@iqra.edu.pk', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Sample subjects
INSERT INTO subjects (subject_name, subject_description) VALUES
('Programming Fundamentals', 'Basic concepts of programming including variables, loops, conditions, and functions'),
('Database Systems', 'Fundamentals of relational databases, SQL queries, normalization, and ER diagrams'),
('Computer Networks', 'Networking concepts including OSI model, TCP/IP, routing, and protocols'),
('Web Development', 'HTML, CSS, JavaScript, PHP, and modern web technologies'),
('Data Structures', 'Arrays, linked lists, stacks, queues, trees, graphs, and algorithms'),
('Operating Systems', 'Process management, memory management, file systems, and scheduling'),
('Software Engineering', 'SDLC, agile methodology, UML diagrams, and software testing'),
('Artificial Intelligence', 'Search algorithms, machine learning basics, neural networks, and NLP');

-- ============================================
-- Sample Questions for Practice Quiz (Question Bank)
-- ============================================

-- Programming Fundamentals - Easy
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 1, 'Which of the following is a valid variable name in most programming languages?', '_myVar', '2ndValue', 'my-var', 'class', 'A', 'Easy'),
(NULL, 1, 'What does the "if" statement do in programming?', 'Repeats a block of code', 'Makes a decision based on a condition', 'Declares a variable', 'Ends the program', 'B', 'Easy'),
(NULL, 1, 'Which data type is used to store whole numbers?', 'float', 'string', 'integer', 'boolean', 'C', 'Easy'),
(NULL, 1, 'What is the output of 10 % 3?', '3', '1', '0', '10', 'B', 'Easy'),
(NULL, 1, 'Which loop is best when you know the exact number of iterations?', 'while loop', 'do-while loop', 'for loop', 'infinite loop', 'C', 'Easy'),
(NULL, 1, 'What symbol is commonly used for single-line comments in C++?', '/* */', '//', '#', '--', 'B', 'Easy'),
(NULL, 1, 'What is a function in programming?', 'A type of variable', 'A reusable block of code', 'A loop structure', 'A data type', 'B', 'Easy'),
(NULL, 1, 'Which operator is used for assignment in most languages?', '==', '=', ':=', '=>', 'B', 'Easy'),
(NULL, 1, 'What does "void" mean as a return type?', 'Returns zero', 'Returns null', 'Returns nothing', 'Returns a string', 'C', 'Easy'),
(NULL, 1, 'Which of the following is NOT a primitive data type?', 'int', 'float', 'array', 'char', 'C', 'Easy');

-- Programming Fundamentals - Medium
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 1, 'What is recursion in programming?', 'A loop that runs forever', 'A function that calls itself', 'A variable that changes type', 'A method of sorting', 'B', 'Medium'),
(NULL, 1, 'What is the purpose of a "break" statement?', 'Skip current iteration', 'Exit the loop entirely', 'Pause execution', 'Return a value', 'B', 'Medium'),
(NULL, 1, 'What is an array?', 'A single variable', 'A collection of elements of the same type', 'A type of function', 'A loop structure', 'B', 'Medium'),
(NULL, 1, 'What is the difference between "==" and "==="?', 'No difference', '"===" checks type and value', '"==" is stricter', 'They are used in different languages only', 'B', 'Medium'),
(NULL, 1, 'What is a pointer?', 'A variable that stores a memory address', 'A function parameter', 'A type of array', 'A debugging tool', 'A', 'Medium'),
(NULL, 1, 'What is the time complexity of a simple for loop iterating n times?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 'Medium'),
(NULL, 1, 'Which sorting algorithm has the best average case?', 'Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort', 'C', 'Medium'),
(NULL, 1, 'What does "scope" refer to in programming?', 'The speed of code execution', 'The visibility of variables', 'The size of a program', 'The number of functions', 'B', 'Medium');

-- Programming Fundamentals - Hard
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 1, 'What is polymorphism in OOP?', 'Having multiple constructors', 'Objects taking many forms', 'Using multiple inheritance', 'Creating abstract classes only', 'B', 'Hard'),
(NULL, 1, 'What is the difference between stack and heap memory?', 'Stack is dynamic, heap is static', 'Stack is for local variables, heap for dynamic allocation', 'They are the same', 'Stack is larger than heap', 'B', 'Hard'),
(NULL, 1, 'What is a deadlock?', 'A program crash', 'When two processes wait for each other indefinitely', 'A memory leak', 'An infinite loop', 'B', 'Hard'),
(NULL, 1, 'What is dynamic programming?', 'Programming at runtime', 'Breaking problems into overlapping subproblems', 'Using dynamic variables', 'Object-oriented design', 'B', 'Hard'),
(NULL, 1, 'What is the space complexity of a recursive Fibonacci function?', 'O(1)', 'O(n)', 'O(log n)', 'O(2^n)', 'B', 'Hard');

-- Database Systems - Easy
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 2, 'What does SQL stand for?', 'Structured Query Language', 'Simple Question Language', 'System Query Logic', 'Standard Query Layout', 'A', 'Easy'),
(NULL, 2, 'Which SQL command is used to retrieve data?', 'INSERT', 'UPDATE', 'SELECT', 'DELETE', 'C', 'Easy'),
(NULL, 2, 'What is a primary key?', 'A foreign reference', 'A unique identifier for a row', 'A column with NULL values', 'A table name', 'B', 'Easy'),
(NULL, 2, 'Which command creates a new table?', 'INSERT TABLE', 'NEW TABLE', 'CREATE TABLE', 'ADD TABLE', 'C', 'Easy'),
(NULL, 2, 'What does DELETE command do?', 'Removes a table', 'Removes rows from a table', 'Removes a database', 'Removes a column', 'B', 'Easy'),
(NULL, 2, 'What is a foreign key?', 'A key from another table', 'A duplicate primary key', 'A key that allows NULL', 'A key for encryption', 'A', 'Easy'),
(NULL, 2, 'Which clause is used to filter rows?', 'ORDER BY', 'GROUP BY', 'WHERE', 'HAVING', 'C', 'Easy'),
(NULL, 2, 'What does INSERT INTO do?', 'Creates a table', 'Adds new rows to a table', 'Updates existing rows', 'Deletes rows', 'B', 'Easy');

-- Database Systems - Medium
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 2, 'What is normalization?', 'Adding more data', 'Organizing data to reduce redundancy', 'Encrypting the database', 'Creating indexes', 'B', 'Medium'),
(NULL, 2, 'What is a JOIN in SQL?', 'Combining two databases', 'Combining rows from two or more tables', 'Adding a new column', 'Creating a backup', 'B', 'Medium'),
(NULL, 2, 'What is an index in a database?', 'A primary key', 'A structure that improves query speed', 'A type of table', 'A backup mechanism', 'B', 'Medium'),
(NULL, 2, 'Which normal form eliminates partial dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'B', 'Medium'),
(NULL, 2, 'What is a transaction in a database?', 'A single query', 'A unit of work that is atomic', 'A type of table', 'A database backup', 'B', 'Medium'),
(NULL, 2, 'What does ACID stand for in databases?', 'Add, Create, Insert, Delete', 'Atomicity, Consistency, Isolation, Durability', 'Access, Control, Identity, Data', 'Automatic, Controlled, Indexed, Distributed', 'B', 'Medium');

-- Database Systems - Hard
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 2, 'What is a stored procedure?', 'A saved query', 'A precompiled SQL program stored in the database', 'A backup script', 'A trigger condition', 'B', 'Hard'),
(NULL, 2, 'What is database sharding?', 'Encrypting data', 'Splitting data across multiple databases', 'Creating replicas', 'Normalizing tables', 'B', 'Hard'),
(NULL, 2, 'What is a deadlock in database systems?', 'A corrupted table', 'Two transactions blocking each other', 'A failed backup', 'An index error', 'B', 'Hard'),
(NULL, 2, 'What is the difference between HAVING and WHERE?', 'No difference', 'HAVING works with aggregated data', 'WHERE is used after GROUP BY', 'HAVING is faster', 'B', 'Hard');

-- Web Development - Easy
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 4, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'Home Tool Markup Language', 'A', 'Easy'),
(NULL, 4, 'Which tag is used for the largest heading?', '<h6>', '<heading>', '<h1>', '<head>', 'C', 'Easy'),
(NULL, 4, 'What does CSS stand for?', 'Computer Style Sheets', 'Creative Style System', 'Cascading Style Sheets', 'Colorful Style Sheets', 'C', 'Easy'),
(NULL, 4, 'Which HTML tag is used to create a link?', '<link>', '<a>', '<href>', '<url>', 'B', 'Easy'),
(NULL, 4, 'What is JavaScript primarily used for?', 'Database management', 'Server configuration', 'Adding interactivity to web pages', 'Styling web pages', 'C', 'Easy'),
(NULL, 4, 'Which CSS property changes text color?', 'text-color', 'font-color', 'color', 'text-style', 'C', 'Easy'),
(NULL, 4, 'What is the correct HTML tag for a paragraph?', '<paragraph>', '<p>', '<text>', '<para>', 'B', 'Easy'),
(NULL, 4, 'Which attribute specifies the URL in an anchor tag?', 'src', 'link', 'href', 'url', 'C', 'Easy');

-- Web Development - Medium
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 4, 'What is the DOM?', 'A CSS framework', 'Document Object Model', 'A JavaScript library', 'A database system', 'B', 'Medium'),
(NULL, 4, 'What does responsive design mean?', 'Fast loading pages', 'Design that adapts to different screen sizes', 'Colorful design', 'Interactive design only', 'B', 'Medium'),
(NULL, 4, 'Which HTTP method is used to send form data?', 'GET', 'POST', 'PUT', 'PATCH', 'B', 'Medium'),
(NULL, 4, 'What is AJAX?', 'A programming language', 'Asynchronous JavaScript and XML', 'A CSS framework', 'A database query language', 'B', 'Medium'),
(NULL, 4, 'What is PHP used for?', 'Client-side scripting', 'Server-side scripting', 'Database design', 'Network configuration', 'B', 'Medium'),
(NULL, 4, 'What is Bootstrap?', 'A JavaScript engine', 'A CSS framework for responsive design', 'A database', 'A server', 'B', 'Medium');

-- Web Development - Hard
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 4, 'What is a RESTful API?', 'A type of database', 'An architectural style for web services', 'A JavaScript framework', 'A CSS methodology', 'B', 'Hard'),
(NULL, 4, 'What is CORS?', 'A CSS property', 'Cross-Origin Resource Sharing', 'A JavaScript function', 'A database feature', 'B', 'Hard'),
(NULL, 4, 'What is the purpose of a service worker?', 'Database management', 'Background processing and offline support', 'Server routing', 'CSS compilation', 'B', 'Hard'),
(NULL, 4, 'What is XSS?', 'A CSS framework', 'Cross-Site Scripting attack', 'A JavaScript library', 'A database query', 'B', 'Hard');

-- Data Structures - Easy
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 5, 'What is an array?', 'A single value variable', 'A collection of elements stored at contiguous locations', 'A type of loop', 'A function', 'B', 'Easy'),
(NULL, 5, 'What data structure follows LIFO principle?', 'Queue', 'Stack', 'Array', 'Linked List', 'B', 'Easy'),
(NULL, 5, 'What data structure follows FIFO principle?', 'Stack', 'Queue', 'Tree', 'Graph', 'B', 'Easy'),
(NULL, 5, 'What is a linked list?', 'An array with fixed size', 'A sequence of nodes connected by pointers', 'A type of tree', 'A sorting algorithm', 'B', 'Easy'),
(NULL, 5, 'What is the head of a linked list?', 'The last node', 'The first node', 'The middle node', 'A null pointer', 'B', 'Easy'),
(NULL, 5, 'How many children can a binary tree node have at most?', '1', '2', '3', 'Unlimited', 'B', 'Easy');

-- Data Structures - Medium
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 5, 'What is the time complexity of searching in a binary search tree (average)?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'B', 'Medium'),
(NULL, 5, 'What is a hash table?', 'A sorted array', 'A data structure using key-value pairs with hash function', 'A type of tree', 'A graph algorithm', 'B', 'Medium'),
(NULL, 5, 'What is a doubly linked list?', 'A list with two heads', 'A list where each node points to next and previous', 'A list with duplicate values', 'Two separate linked lists', 'B', 'Medium'),
(NULL, 5, 'What is a priority queue?', 'A regular queue', 'A queue where elements are served by priority', 'A stack variant', 'A sorted array', 'B', 'Medium'),
(NULL, 5, 'What traversal visits root, then left, then right?', 'Inorder', 'Preorder', 'Postorder', 'Level order', 'B', 'Medium');

-- Data Structures - Hard
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 5, 'What is an AVL tree?', 'A binary tree', 'A self-balancing binary search tree', 'A B-tree variant', 'A red-black tree', 'B', 'Hard'),
(NULL, 5, 'What is the worst case time complexity of quicksort?', 'O(n log n)', 'O(n)', 'O(n²)', 'O(log n)', 'C', 'Hard'),
(NULL, 5, 'What is a trie data structure used for?', 'Sorting numbers', 'Efficient string searching and prefix matching', 'Graph traversal', 'Matrix operations', 'B', 'Hard'),
(NULL, 5, 'What is amortized analysis?', 'Worst case analysis', 'Average cost per operation over a sequence', 'Best case analysis', 'Space complexity analysis', 'B', 'Hard');

-- Computer Networks - Easy
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 3, 'What does IP stand for?', 'Internet Protocol', 'Internal Program', 'Internet Process', 'Integrated Protocol', 'A', 'Easy'),
(NULL, 3, 'How many layers does the OSI model have?', '5', '6', '7', '4', 'C', 'Easy'),
(NULL, 3, 'What device connects multiple networks?', 'Hub', 'Switch', 'Router', 'Repeater', 'C', 'Easy'),
(NULL, 3, 'What does HTTP stand for?', 'HyperText Transfer Protocol', 'High Tech Transfer Protocol', 'Hyper Transfer Text Protocol', 'Home Text Transfer Protocol', 'A', 'Easy'),
(NULL, 3, 'What is a MAC address?', 'An IP address', 'A physical hardware address', 'A software address', 'A domain name', 'B', 'Easy'),
(NULL, 3, 'What port does HTTP use by default?', '443', '21', '80', '25', 'C', 'Easy');

-- Computer Networks - Medium
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 3, 'What is the purpose of DNS?', 'File transfer', 'Translating domain names to IP addresses', 'Email routing', 'Data encryption', 'B', 'Medium'),
(NULL, 3, 'Which protocol is connection-oriented?', 'UDP', 'TCP', 'ICMP', 'ARP', 'B', 'Medium'),
(NULL, 3, 'What is a subnet mask?', 'A firewall rule', 'A value that divides IP into network and host parts', 'An encryption key', 'A routing table', 'B', 'Medium'),
(NULL, 3, 'What layer of OSI is responsible for routing?', 'Data Link', 'Network', 'Transport', 'Session', 'B', 'Medium'),
(NULL, 3, 'What is NAT?', 'Network Access Token', 'Network Address Translation', 'Network Authentication Tool', 'Network Analysis Test', 'B', 'Medium');

-- Computer Networks - Hard
INSERT INTO questions (quiz_id, subject_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
(NULL, 3, 'What is BGP?', 'A LAN protocol', 'Border Gateway Protocol for inter-AS routing', 'A transport protocol', 'A DNS record type', 'B', 'Hard'),
(NULL, 3, 'What is the three-way handshake in TCP?', 'SYN, ACK, FIN', 'SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'FIN, ACK, SYN', 'B', 'Hard'),
(NULL, 3, 'What is CIDR notation?', 'A DNS format', 'Classless Inter-Domain Routing for IP addressing', 'A MAC address format', 'A port numbering system', 'B', 'Hard');

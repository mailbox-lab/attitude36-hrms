import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashSync } from 'bcryptjs';

export async function POST() {
  try {
    // Clear existing data in reverse dependency order
    await db.placement.deleteMany();
    await db.interview.deleteMany();
    await db.attendance.deleteMany();
    await db.leaveRequest.deleteMany();
    await db.leaveBalance.deleteMany();
    await db.candidate.deleteMany();
    await db.jobOpening.deleteMany();
    await db.employee.deleteMany();
    await db.client.deleteMany();

    // ===== EMPLOYEES =====
    // Hierarchy: Founder/Co-Founder → HR → Employees
    const employees = await Promise.all([
      db.employee.create({
        data: {
          name: 'Arjun Mehta',
          email: 'arjun@attitude360.com',
          phone: '+91-9876543210',
          password: hashSync('founder123', 10),
          role: 'FOUNDER',
          designation: 'Founder & CEO',
          department: 'Leadership',
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Priya Sharma',
          email: 'priya@attitude360.com',
          phone: '+91-9876543211',
          password: hashSync('founder123', 10),
          role: 'COFOUNDER',
          designation: 'Co-Founder & CTO',
          department: 'Leadership',
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Rahul Verma',
          email: 'rahul@attitude360.com',
          phone: '+91-9876543212',
          password: hashSync('hr123', 10),
          role: 'HR',
          designation: 'HR Manager',
          department: 'Human Resources',
          reportingToId: undefined, // Will be set after founder creation
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Sneha Patel',
          email: 'sneha@attitude360.com',
          phone: '+91-9876543213',
          password: hashSync('hr123', 10),
          role: 'HR',
          designation: 'Senior HR Executive',
          department: 'Human Resources',
          reportingToId: undefined, // Will be set after founder creation
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Vikram Singh',
          email: 'vikram@attitude360.com',
          phone: '+91-9876543214',
          password: hashSync('emp123', 10),
          role: 'EMPLOYEE',
          designation: 'Recruiter',
          department: 'Recruitment',
          reportingToId: undefined, // Will be set after HR creation
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Anita Desai',
          email: 'anita@attitude360.com',
          phone: '+91-9876543215',
          password: hashSync('emp123', 10),
          role: 'EMPLOYEE',
          designation: 'Senior Recruiter',
          department: 'Recruitment',
          reportingToId: undefined, // Will be set after HR creation
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Kiran Rao',
          email: 'kiran@attitude360.com',
          phone: '+91-9876543216',
          password: hashSync('emp123', 10),
          role: 'EMPLOYEE',
          designation: 'Marketing Associate',
          department: 'Marketing',
          reportingToId: undefined,
          isActive: true,
        },
      }),
      db.employee.create({
        data: {
          name: 'Deepak Joshi',
          email: 'deepak@attitude360.com',
          phone: '+91-9876543217',
          password: hashSync('emp123', 10),
          role: 'EMPLOYEE',
          designation: 'Finance Analyst',
          department: 'Finance',
          reportingToId: undefined,
          isActive: true,
        },
      }),
    ]);

    // Set up reporting hierarchy
    // HR reports to Founder
    await db.employee.update({ where: { id: employees[2].id }, data: { reportingToId: employees[0].id } });
    await db.employee.update({ where: { id: employees[3].id }, data: { reportingToId: employees[0].id } });
    // Employees report to HR
    await db.employee.update({ where: { id: employees[4].id }, data: { reportingToId: employees[2].id } });
    await db.employee.update({ where: { id: employees[5].id }, data: { reportingToId: employees[2].id } });
    await db.employee.update({ where: { id: employees[6].id }, data: { reportingToId: employees[3].id } });
    await db.employee.update({ where: { id: employees[7].id }, data: { reportingToId: employees[3].id } });

    // ===== CLIENTS =====
    const clients = await Promise.all([
      db.client.create({
        data: {
          name: 'TechNova Solutions',
          industry: 'Information Technology',
          website: 'https://technova.com',
          address: '42, MG Road, Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          description: 'Leading software development company specializing in cloud-native solutions and enterprise applications.',
          contactName: 'Karthik Rajan',
          contactEmail: 'karthik@technova.com',
          contactPhone: '+91-80-4567-8901',
          status: 'Active',
        },
      }),
      db.client.create({
        data: {
          name: 'FinEdge Analytics',
          industry: 'Financial Services',
          website: 'https://finedge.co.in',
          address: '15, BKC, Bandra Kurla Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          description: 'Fintech startup providing AI-powered analytics and risk management solutions to banks.',
          contactName: 'Meera Krishnan',
          contactEmail: 'meera@finedge.co.in',
          contactPhone: '+91-22-3456-7890',
          status: 'Active',
        },
      }),
      db.client.create({
        data: {
          name: 'HealthPulse Technologies',
          industry: 'Healthcare',
          website: 'https://healthpulse.in',
          address: 'Plot 7, HITEC City',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          description: 'Healthcare technology company building digital health records and telemedicine platforms.',
          contactName: 'Dr. Suresh Babu',
          contactEmail: 'suresh@healthpulse.in',
          contactPhone: '+91-40-5678-9012',
          status: 'Active',
        },
      }),
      db.client.create({
        data: {
          name: 'GreenLogix Manufacturing',
          industry: 'Manufacturing',
          website: 'https://greenlogix.com',
          address: '23, Industrial Area Phase 2',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          description: 'Sustainable manufacturing company producing eco-friendly packaging and industrial materials.',
          contactName: 'Rajesh Nair',
          contactEmail: 'rajesh@greenlogix.com',
          contactPhone: '+91-44-6789-0123',
          status: 'Active',
        },
      }),
      db.client.create({
        data: {
          name: 'EduSpark Learning',
          industry: 'Education Technology',
          website: 'https://eduspark.io',
          address: '88, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          description: 'EdTech platform offering personalized learning solutions and corporate training programs.',
          contactName: 'Amit Verma',
          contactEmail: 'amit@eduspark.io',
          contactPhone: '+91-11-7890-1234',
          status: 'Active',
        },
      }),
    ]);

    // ===== JOB OPENINGS =====
    const jobs = await Promise.all([
      db.jobOpening.create({
        data: {
          title: 'Senior React Developer',
          clientId: clients[0].id,
          recruiterId: employees[1].id,
          department: 'Engineering',
          location: 'Bangalore',
          employmentType: 'Full-Time',
          salaryMin: 1800000,
          salaryMax: 2800000,
          currency: 'INR',
          description: 'We are looking for an experienced React developer to join our front-end team.',
          requirements: 'React, TypeScript, Redux, REST APIs, 5+ years experience',
          status: 'Open',
          priority: 'High',
          openings: 2,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'Backend Engineer - Python',
          clientId: clients[0].id,
          recruiterId: employees[1].id,
          department: 'Engineering',
          location: 'Bangalore',
          employmentType: 'Full-Time',
          salaryMin: 1500000,
          salaryMax: 2500000,
          currency: 'INR',
          description: 'Build scalable backend services using Python and microservices architecture.',
          requirements: 'Python, Django/FastAPI, PostgreSQL, Docker, 3+ years experience',
          status: 'Open',
          priority: 'High',
          openings: 1,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'Data Scientist',
          clientId: clients[1].id,
          recruiterId: employees[3].id,
          department: 'Analytics',
          location: 'Mumbai',
          employmentType: 'Full-Time',
          salaryMin: 2000000,
          salaryMax: 3500000,
          currency: 'INR',
          description: 'Develop ML models for credit risk assessment and fraud detection.',
          requirements: 'Python, TensorFlow/PyTorch, SQL, Statistics, 4+ years experience',
          status: 'Open',
          priority: 'Critical',
          openings: 1,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'Full Stack Developer',
          clientId: clients[1].id,
          recruiterId: employees[3].id,
          department: 'Engineering',
          location: 'Mumbai',
          employmentType: 'Full-Time',
          salaryMin: 1600000,
          salaryMax: 2400000,
          currency: 'INR',
          description: 'Build full-stack features for our fintech platform.',
          requirements: 'React, Node.js, MongoDB, AWS, 3+ years experience',
          status: 'Open',
          priority: 'Medium',
          openings: 2,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'DevOps Engineer',
          clientId: clients[2].id,
          recruiterId: employees[2].id,
          department: 'Infrastructure',
          location: 'Hyderabad',
          employmentType: 'Full-Time',
          salaryMin: 1800000,
          salaryMax: 3000000,
          currency: 'INR',
          description: 'Manage cloud infrastructure and CI/CD pipelines for healthcare platform.',
          requirements: 'AWS/GCP, Kubernetes, Terraform, Jenkins, 4+ years experience',
          status: 'Open',
          priority: 'Medium',
          openings: 1,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'QA Lead',
          clientId: clients[3].id,
          recruiterId: employees[4].id,
          department: 'Quality',
          location: 'Chennai',
          employmentType: 'Full-Time',
          salaryMin: 1200000,
          salaryMax: 2000000,
          currency: 'INR',
          description: 'Lead the quality assurance team and establish testing frameworks.',
          requirements: 'Selenium, Cypress, API Testing, Team Management, 6+ years experience',
          status: 'On Hold',
          priority: 'Low',
          openings: 1,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'Product Manager',
          clientId: clients[4].id,
          recruiterId: employees[2].id,
          department: 'Product',
          location: 'New Delhi',
          employmentType: 'Full-Time',
          salaryMin: 2200000,
          salaryMax: 3800000,
          currency: 'INR',
          description: 'Define product roadmap and drive strategy for our learning platform.',
          requirements: 'Product Management, EdTech experience, Data-driven, 5+ years experience',
          status: 'Open',
          priority: 'High',
          openings: 1,
        },
      }),
      db.jobOpening.create({
        data: {
          title: 'UI/UX Designer',
          clientId: clients[4].id,
          recruiterId: employees[4].id,
          department: 'Design',
          location: 'New Delhi',
          employmentType: 'Full-Time',
          salaryMin: 1000000,
          salaryMax: 1800000,
          currency: 'INR',
          description: 'Design intuitive user interfaces for educational products.',
          requirements: 'Figma, Adobe XD, User Research, Prototyping, 3+ years experience',
          status: 'Open',
          priority: 'Medium',
          openings: 1,
        },
      }),
    ]);

    // ===== CANDIDATES =====
    const candidateData = [
      { firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@gmail.com', phone: '+91-9988776655', title: 'Senior Frontend Developer', location: 'Bangalore', experience: 6, currentCompany: 'Infosys', currentCTC: 1600000, expectedCTC: 2400000, source: 'Naukri', skills: 'React, TypeScript, Redux, Next.js, GraphQL', status: 'Interview', jobId: jobs[0].id, rating: 4, noticePeriod: 30 },
      { firstName: 'Deepa', lastName: 'Nair', email: 'deepa.nair@yahoo.com', phone: '+91-9988776656', title: 'React Developer', location: 'Bangalore', experience: 4, currentCompany: 'Wipro', currentCTC: 1200000, expectedCTC: 1800000, source: 'LinkedIn', skills: 'React, JavaScript, CSS, HTML, Bootstrap', status: 'Screening', jobId: jobs[0].id, rating: 3, noticePeriod: 60 },
      { firstName: 'Suresh', lastName: 'Gupta', email: 'suresh.gupta@gmail.com', phone: '+91-9988776657', title: 'Python Developer', location: 'Pune', experience: 5, currentCompany: 'TCS', currentCTC: 1400000, expectedCTC: 2200000, source: 'Referral', skills: 'Python, Django, Flask, PostgreSQL, Docker', status: 'Interview', jobId: jobs[1].id, rating: 4, noticePeriod: 30 },
      { firstName: 'Kavitha', lastName: 'Raman', email: 'kavitha.r@gmail.com', phone: '+91-9988776658', title: 'Data Scientist', location: 'Mumbai', experience: 7, currentCompany: 'Accenture', currentCTC: 2800000, expectedCTC: 3500000, source: 'LinkedIn', skills: 'Python, Machine Learning, TensorFlow, SQL, Statistics, NLP', status: 'Offer', jobId: jobs[2].id, rating: 5, noticePeriod: 15 },
      { firstName: 'Rohit', lastName: 'Joshi', email: 'rohit.j@gmail.com', phone: '+91-9988776659', title: 'Full Stack Developer', location: 'Mumbai', experience: 4, currentCompany: 'Capgemini', currentCTC: 1300000, expectedCTC: 2000000, source: 'Naukri', skills: 'React, Node.js, Express, MongoDB, AWS', status: 'New', jobId: jobs[3].id, rating: 3, noticePeriod: 45 },
      { firstName: 'Lakshmi', lastName: 'Iyer', email: 'lakshmi.iyer@gmail.com', phone: '+91-9988776660', title: 'DevOps Engineer', location: 'Hyderabad', experience: 5, currentCompany: 'Amazon', currentCTC: 3000000, expectedCTC: 3800000, source: 'LinkedIn', skills: 'AWS, Kubernetes, Docker, Terraform, CI/CD, Linux', status: 'Interview', jobId: jobs[4].id, rating: 5, noticePeriod: 60 },
      { firstName: 'Nikhil', lastName: 'Patil', email: 'nikhil.p@gmail.com', phone: '+91-9988776661', title: 'QA Engineer', location: 'Chennai', experience: 3, currentCompany: 'Cognizant', currentCTC: 800000, expectedCTC: 1200000, source: 'Naukri', skills: 'Selenium, Java, TestNG, API Testing, SQL', status: 'New', jobId: jobs[5].id, rating: 2, noticePeriod: 30 },
      { firstName: 'Priti', lastName: 'Das', email: 'pritidas@gmail.com', phone: '+91-9988776662', title: 'Product Manager', location: 'New Delhi', experience: 8, currentCompany: 'Paytm', currentCTC: 3500000, expectedCTC: 4200000, source: 'Referral', skills: 'Product Strategy, Agile, Data Analytics, User Research, Roadmapping', status: 'Interview', jobId: jobs[6].id, rating: 5, noticePeriod: 30 },
      { firstName: 'Sanjay', lastName: 'Verma', email: 'sanjay.v@gmail.com', phone: '+91-9988776663', title: 'Senior React Developer', location: 'Bangalore', experience: 8, currentCompany: 'Flipkart', currentCTC: 3200000, expectedCTC: 4000000, source: 'LinkedIn', skills: 'React, TypeScript, Next.js, Node.js, System Design', status: 'Offer', jobId: jobs[0].id, rating: 5, noticePeriod: 15 },
      { firstName: 'Ritu', lastName: 'Sharma', email: 'ritu.sharma@gmail.com', phone: '+91-9988776664', title: 'UI/UX Designer', location: 'New Delhi', experience: 5, currentCompany: 'Swiggy', currentCTC: 1500000, expectedCTC: 2200000, source: 'Naukri', skills: 'Figma, Adobe XD, Sketch, User Research, Wireframing, Prototyping', status: 'Screening', jobId: jobs[7].id, rating: 4, noticePeriod: 30 },
      { firstName: 'Aravind', lastName: 'Krishnan', email: 'aravind.k@gmail.com', phone: '+91-9988776665', title: 'Backend Developer', location: 'Bangalore', experience: 3, currentCompany: 'Freshworks', currentCTC: 1100000, expectedCTC: 1600000, source: 'Campus', skills: 'Node.js, Express, MongoDB, Redis, AWS', status: 'New', jobId: jobs[1].id, rating: 3, noticePeriod: 0 },
      { firstName: 'Meena', lastName: 'Kumari', email: 'meena.k@gmail.com', phone: '+91-9988776666', title: 'Data Analyst', location: 'Mumbai', experience: 2, currentCompany: null, currentCTC: null, expectedCTC: 900000, source: 'Naukri', skills: 'SQL, Python, Tableau, Excel, Statistics', status: 'New', jobId: jobs[2].id, rating: 2, noticePeriod: 0 },
      { firstName: 'Vishal', lastName: 'Pandey', email: 'vishal.p@gmail.com', phone: '+91-9988776667', title: 'Cloud Engineer', location: 'Hyderabad', experience: 6, currentCompany: 'Microsoft', currentCTC: 3500000, expectedCTC: 4200000, source: 'LinkedIn', skills: 'Azure, AWS, Kubernetes, Terraform, Python, Go', status: 'Interview', jobId: jobs[4].id, rating: 5, noticePeriod: 90 },
      { firstName: 'Anjali', lastName: 'Mishra', email: 'anjali.m@gmail.com', phone: '+91-9988776668', title: 'Full Stack Developer', location: 'Mumbai', experience: 5, currentCompany: 'Razorpay', currentCTC: 2200000, expectedCTC: 2800000, source: 'Referral', skills: 'React, Node.js, TypeScript, PostgreSQL, AWS', status: 'Offer', jobId: jobs[3].id, rating: 4, noticePeriod: 30 },
      { firstName: 'Karthik', lastName: 'Menon', email: 'karthik.m@gmail.com', phone: '+91-9988776669', title: 'React Native Developer', location: 'Bangalore', experience: 4, currentCompany: 'Ola', currentCTC: 1800000, expectedCTC: 2500000, source: 'Naukri', skills: 'React Native, JavaScript, Redux, iOS, Android', status: 'Screening', jobId: jobs[0].id, rating: 3, noticePeriod: 30 },
      { firstName: 'Divya', lastName: 'Reddy', email: 'divya.r@gmail.com', phone: '+91-9988776670', title: 'ML Engineer', location: 'Hyderabad', experience: 3, currentCompany: 'ServiceNow', currentCTC: 2000000, expectedCTC: 2800000, source: 'LinkedIn', skills: 'Python, TensorFlow, PyTorch, MLOps, Docker, Kubernetes', status: 'Interview', jobId: jobs[2].id, rating: 4, noticePeriod: 30 },
      { firstName: 'Manish', lastName: 'Agarwal', email: 'manish.a@gmail.com', phone: '+91-9988776671', title: 'Senior Python Developer', location: 'Bangalore', experience: 7, currentCompany: 'Google', currentCTC: 4000000, expectedCTC: 5000000, source: 'Referral', skills: 'Python, Go, System Design, Microservices, gRPC, PostgreSQL', status: 'Offer', jobId: jobs[1].id, rating: 5, noticePeriod: 60 },
      { firstName: 'Swati', lastName: 'Jain', email: 'swati.j@gmail.com', phone: '+91-9988776672', title: 'QA Lead', location: 'Chennai', experience: 8, currentCompany: 'Zoho', currentCTC: 1800000, expectedCTC: 2500000, source: 'Naukri', skills: 'Selenium, Cypress, API Testing, Performance Testing, Team Management', status: 'Interview', jobId: jobs[5].id, rating: 4, noticePeriod: 30 },
    ];

    const candidates = await Promise.all(
      candidateData.map((c) =>
        db.candidate.create({ data: c })
      )
    );

    // ===== INTERVIEWS =====
    const now = new Date();
    const interviewData = [
      { candidateId: candidates[0].id, jobId: jobs[0].id, type: 'Technical', interviewer: 'Priya Sharma', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), duration: 60, meetingLink: 'https://meet.google.com/abc-defg-hij', status: 'Completed', feedback: 'Strong React skills, good system design understanding. Recommended for next round.', rating: 4 },
      { candidateId: candidates[0].id, jobId: jobs[0].id, type: 'HR', interviewer: 'Rahul Verma', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), duration: 45, meetingLink: 'https://meet.google.com/klm-nopq-rst', status: 'Completed', feedback: 'Good communication skills. Culture fit looks positive.', rating: 4 },
      { candidateId: candidates[2].id, jobId: jobs[1].id, type: 'Technical', interviewer: 'Priya Sharma', date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), duration: 60, meetingLink: 'https://meet.google.com/uvw-xyza-bcd', status: 'Scheduled', feedback: null, rating: null },
      { candidateId: candidates[3].id, jobId: jobs[2].id, type: 'Technical', interviewer: 'Sneha Patel', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), duration: 90, meetingLink: 'https://meet.google.com/efg-hijk-lmn', status: 'Completed', feedback: 'Excellent ML knowledge. Solved all coding challenges. Strong hire recommendation.', rating: 5 },
      { candidateId: candidates[3].id, jobId: jobs[2].id, type: 'HR', interviewer: 'Rahul Verma', date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), duration: 45, meetingLink: 'https://meet.google.com/opq-rstu-vwx', status: 'Completed', feedback: 'Great fit for the team. Salary expectations are within range.', rating: 5 },
      { candidateId: candidates[5].id, jobId: jobs[4].id, type: 'Technical', interviewer: 'Anita Desai', date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), duration: 60, meetingLink: 'https://meet.google.com/yza-bcde-fgh', status: 'Scheduled', feedback: null, rating: null },
      { candidateId: candidates[7].id, jobId: jobs[6].id, type: 'Case Study', interviewer: 'Arjun Mehta', date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), duration: 90, meetingLink: 'https://meet.google.com/ijk-lmno-pqr', status: 'Scheduled', feedback: null, rating: null },
      { candidateId: candidates[8].id, jobId: jobs[0].id, type: 'Technical', interviewer: 'Priya Sharma', date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), duration: 75, meetingLink: 'https://meet.google.com/stu-vwxy-zab', status: 'Completed', feedback: 'Outstanding frontend skills. Deep understanding of React internals.', rating: 5 },
      { candidateId: candidates[8].id, jobId: jobs[0].id, type: 'HR', interviewer: 'Rahul Verma', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), duration: 45, meetingLink: 'https://meet.google.com/cde-fghi-jkl', status: 'Completed', feedback: 'Strong candidate. Discussed compensation expectations.', rating: 5 },
      { candidateId: candidates[12].id, jobId: jobs[4].id, type: 'Technical', interviewer: 'Anita Desai', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), duration: 60, meetingLink: 'https://meet.google.com/mno-pqrs-tuv', status: 'Completed', feedback: 'Very strong cloud background. Could be a great asset for infrastructure team.', rating: 4 },
    ];

    await Promise.all(
      interviewData.map((i) => db.interview.create({ data: i }))
    );

    // ===== PLACEMENTS =====
    const placementData = [
      { candidateId: candidates[3].id, jobId: jobs[2].id, clientId: clients[1].id, recruiterId: employees[3].id, offeredCTC: 3400000, joinedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'Joined', commission: 340000 },
      { candidateId: candidates[8].id, jobId: jobs[0].id, clientId: clients[0].id, recruiterId: employees[1].id, offeredCTC: 3800000, joinedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: 'Joined', commission: 380000 },
      { candidateId: candidates[13].id, jobId: jobs[3].id, clientId: clients[1].id, recruiterId: employees[3].id, offeredCTC: 2700000, joinedDate: null, status: 'Offered', commission: null },
      { candidateId: candidates[16].id, jobId: jobs[1].id, clientId: clients[0].id, recruiterId: employees[1].id, offeredCTC: 4500000, joinedDate: null, status: 'Offered', commission: null },
    ];

    await Promise.all(
      placementData.map((p) => db.placement.create({ data: p }))
    );

    // ===== ATTENDANCE (30 days for all employees) =====
    const attendanceRecords: Array<{
      employeeId: string;
      date: Date;
      clockIn: Date;
      clockOut: Date;
      status: string;
      totalHours: number;
      notes?: string;
    }> = [];

    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      const dayOfWeek = date.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const emp of employees) {
        // Randomize some absences and half-days
        const rand = Math.random();
        if (rand < 0.05) {
          // 5% chance of leave
          attendanceRecords.push({
            employeeId: emp.id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            clockIn: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            clockOut: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
            status: 'Leave',
            totalHours: 0,
            notes: 'Planned leave',
          });
        } else if (rand < 0.1) {
          // 5% chance of work from home
          const clockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + Math.random(), Math.floor(Math.random() * 30), 0);
          const clockOut = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17 + Math.random(), Math.floor(Math.random() * 60), 0);
          const totalHours = parseFloat(((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
          attendanceRecords.push({
            employeeId: emp.id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            clockIn,
            clockOut,
            status: 'WFH',
            totalHours,
          });
        } else if (rand < 0.15) {
          // 5% chance of half-day
          const clockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0);
          const clockOut = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 30, 0);
          attendanceRecords.push({
            employeeId: emp.id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            clockIn,
            clockOut,
            status: 'Half Day',
            totalHours: 4.5,
          });
        } else {
          // Normal day
          const clockInHour = 8 + Math.floor(Math.random() * 2); // 8 or 9
          const clockInMin = Math.floor(Math.random() * 30);
          const clockOutHour = 17 + Math.floor(Math.random() * 2); // 17 or 18
          const clockOutMin = Math.floor(Math.random() * 60);
          const clockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), clockInHour, clockInMin, 0);
          const clockOut = new Date(date.getFullYear(), date.getMonth(), date.getDate(), clockOutHour, clockOutMin, 0);
          const totalHours = parseFloat(((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
          attendanceRecords.push({
            employeeId: emp.id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            clockIn,
            clockOut,
            status: 'Present',
            totalHours,
          });
        }
      }
    }

    // Insert attendance in batches
    const batchSize = 50;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      await Promise.all(
        attendanceRecords.slice(i, i + batchSize).map((a) =>
          db.attendance.create({ data: a })
        )
      );
    }

    // ===== LEAVE BALANCES (current year) =====
    const currentYear = now.getFullYear();
    const leaveBalanceData: Array<{
      employeeId: string;
      year: number;
      type: string;
      total: number;
      used: number;
      remaining: number;
    }> = [];

    for (const emp of employees) {
      leaveBalanceData.push(
        { employeeId: emp.id, year: currentYear, type: 'Casual Leave', total: 12, used: 0, remaining: 12 },
        { employeeId: emp.id, year: currentYear, type: 'Sick Leave', total: 10, used: 0, remaining: 10 },
        { employeeId: emp.id, year: currentYear, type: 'Earned Leave', total: 15, used: 0, remaining: 15 },
        { employeeId: emp.id, year: currentYear, type: 'Compensatory Off', total: 2, used: 0, remaining: 2 },
      );
    }

    await Promise.all(
      leaveBalanceData.map((lb) => db.leaveBalance.create({ data: lb }))
    );

    // ===== LEAVE REQUESTS =====
    // Hierarchy-based: Employee leave → needs HR approval, HR leave → needs Founder approval
    // Founder/Co-Founder leave → auto-approved
    const leaveRequestData = [
      // Founder (auto-approved)
      {
        employeeId: employees[0].id, type: 'Casual Leave',
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        totalDays: 3, reason: 'Family function',
        status: 'Approved', approvalStep: null, approverRole: null,
      },
      // Co-Founder (auto-approved)
      {
        employeeId: employees[1].id, type: 'Sick Leave',
        startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalDays: 1, reason: 'Not feeling well, doctor appointment',
        status: 'Approved', approvalStep: null, approverRole: null,
      },
      // HR (needs Founder approval) - Pending
      {
        employeeId: employees[2].id, type: 'Casual Leave',
        startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        totalDays: 3, reason: 'Travel plans',
        status: 'Pending', approvalStep: 1, approverRole: 'FOUNDER_OR_COFOUNDER',
      },
      // HR (needs Founder approval) - Pending
      {
        employeeId: employees[3].id, type: 'Earned Leave',
        startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
        totalDays: 5, reason: 'Vacation with family',
        status: 'Pending', approvalStep: 1, approverRole: 'FOUNDER_OR_COFOUNDER',
      },
      // Employee (needs HR approval) - Rejected by HR
      {
        employeeId: employees[4].id, type: 'Casual Leave',
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        totalDays: 1, reason: 'Personal work',
        status: 'Rejected', approvalStep: null, approverRole: null,
        approvedByLevel1: employees[2].id, approvedAtLevel1: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
        remarkL1: 'Critical project deadline, cannot approve.', rejectionReason: 'Critical project deadline, cannot approve.',
      },
      // Employee (needs HR approval) - Pending
      {
        employeeId: employees[5].id, type: 'Earned Leave',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        totalDays: 8, reason: 'International travel',
        status: 'Pending', approvalStep: 1, approverRole: 'HR',
      },
      // Employee (needs HR approval) - Pending
      {
        employeeId: employees[6].id, type: 'Sick Leave',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        totalDays: 2, reason: 'Fever and cold, need rest',
        status: 'Pending', approvalStep: 1, approverRole: 'HR',
      },
      // Employee (needs HR approval) - Approved
      {
        employeeId: employees[7].id, type: 'Casual Leave',
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        totalDays: 2, reason: 'Family event',
        status: 'Approved', approvalStep: null, approverRole: null,
        approvedByLevel1: employees[3].id, approvedAtLevel1: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        remarkL1: 'Approved. Have a good time!',
      },
    ];

    await Promise.all(
      leaveRequestData.map((lr) => db.leaveRequest.create({ data: lr }))
    );

    return NextResponse.json({
      message: 'Seed data created successfully',
      counts: {
        employees: employees.length,
        clients: clients.length,
        jobs: jobs.length,
        candidates: candidates.length,
        interviews: interviewData.length,
        placements: placementData.length,
        attendanceRecords: attendanceRecords.length,
        leaveBalances: leaveBalanceData.length,
        leaveRequests: leaveRequestData.length,
      },
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}

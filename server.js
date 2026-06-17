const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const STUDENTS_FILE = path.join(__dirname, 'students.json');
const VOTES_FILE = path.join(__dirname, 'votes.json');

// Categories definition
const categories = [
  { id: "pi_hamogelastos", label: "Πιο χαμογελαστός/η", emoji: "😊" },
  { id: "pi_evgenikos", label: "Πιο ευγενικός/η", emoji: "🙏" },
  { id: "pi_astios", label: "Πιο αστείος/α", emoji: "😂" },
  { id: "pi_organomenos", label: "Πιο οργανωμένος/η", emoji: "📅" },
  { id: "kaliteri_choreftria", label: "Καλύτερη χορεύτρια", emoji: "💃" },
  { id: "kaliteros_choreftis", label: "Καλύτερος χορευτής", emoji: "🕺" },
  { id: "kaliteri_foni", label: "Καλύτερη φωνή", emoji: "🎤" },
  { id: "pi_kalontimeni", label: "Πιο καλοντυμένη", emoji: "👗" },
  { id: "tiktoker", label: "Η tiktoker της παρέας", emoji: "📱" },
  { id: "kaliteri_prosopikotita", label: "Καλύτερη προσωπικότητα", emoji: "🌟" },
  { id: "kalitero_style", label: "Καλύτερο στυλ", emoji: "✨" },
  { id: "pi_kinonikos", label: "Η/Ο πιο κοινωνικός/η", emoji: "🤝" },
  { id: "pi_dimiourgikos", label: "Ο/Η πιο δημιουργικός/η", emoji: "🎨" },
  { id: "pi_argoporimenos", label: "Πιο αργοπορημένος/η", emoji: "⏰" },
  { id: "kalitero_chamogelo", label: "Το καλύτερο χαμόγελο", emoji: "😁" },
  { id: "kalitera_mallia", label: "Καλύτερα μαλλιά", emoji: "💇" },
  { id: "fashion_icon", label: "Fashion icon", emoji: "🕶️" },
  { id: "vlogger", label: "Η vlogger της παρέας", emoji: "📹" },
  { id: "kaliteros_athlitis", label: "Καλύτερος αθλητής", emoji: "🏃‍♂️" },
  { id: "kaliteri_athlitria", label: "Καλύτερη αθλήτρια", emoji: "🏃‍♀️" }
];

// Helper to normalize entered password for comparison
function toGreeklish(str) {
  if (!str) return '';
  let normalized = str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapping = {
    'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps',
    'ω': 'o'
  };

  normalized = normalized.replace(/ου/g, 'ou');
  normalized = normalized.replace(/αι/g, 'ai');
  normalized = normalized.replace(/ει/g, 'ei');
  normalized = normalized.replace(/οι/g, 'oi');
  normalized = normalized.replace(/μπ/g, 'mp');
  normalized = normalized.replace(/ντ/g, 'nt');
  normalized = normalized.replace(/τζ/g, 'tz');
  normalized = normalized.replace(/τσ/g, 'ts');
  normalized = normalized.replace(/αυ/g, 'av');
  normalized = normalized.replace(/ευ/g, 'ev');

  let result = '';
  for (let char of normalized) {
    result += mapping[char] || char;
  }
  return result;
}

// Read students data
function getStudents() {
  if (!fs.existsSync(STUDENTS_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf-8'));
}

// Read votes data
function getVotes() {
  if (!fs.existsSync(VOTES_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

// Save votes data
function saveVotes(votes) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2), 'utf-8');
}

// Password matching logic
function verifyPassword(student, submittedPassword) {
  if (!submittedPassword) return false;
  
  // Clean submitted password: lowercase, remove spaces, remove accents
  const cleanedInput = submittedPassword.trim().toLowerCase().replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanedInputGreeklish = toGreeklish(submittedPassword.trim().replace(/\s+/g, ''));
  
  // Match with any of the precalculated allowed passwords
  return student.passwords.some(pass => {
    const cleanedPass = pass.toLowerCase().trim();
    return cleanedInput === cleanedPass || cleanedInputGreeklish === cleanedPass;
  });
}

// --- API Endpoints ---

// Get active categories list
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Get sanitized students list (excluding passwords for security!)
app.get('/api/students', (req, res) => {
  const students = getStudents();
  const sanitized = students.map(s => ({
    id: s.id,
    fullName: s.fullName,
    class: s.class,
    surname: s.surname,
    firstNames: s.firstNames
  }));
  res.json(sanitized);
});

// Student login endpoint
app.post('/api/login', (req, res) => {
  const { studentId, password } = req.body;
  if (!studentId || !password) {
    return res.status(400).json({ error: 'Παρακαλώ συμπληρώστε όλα τα πεδία.' });
  }

  const students = getStudents();
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return res.status(404).json({ error: 'Ο μαθητής δεν βρέθηκε.' });
  }

  if (verifyPassword(student, password)) {
    // Read their current votes if any
    const allVotes = getVotes();
    const studentVotes = allVotes[studentId] || {};

    res.json({
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        class: student.class
      },
      existingVotes: studentVotes
    });
  } else {
    res.status(401).json({ error: 'Λανθασμένο συνθηματικό (Το συνθηματικό είναι το επίθετό σας και το 2026, π.χ. savva2026).' });
  }
});

// Submit / Update votes
app.post('/api/vote', (req, res) => {
  const { studentId, password, votes } = req.body;

  if (!studentId || !password || !votes) {
    return res.status(400).json({ error: 'Μη έγκυρα δεδομένα ψήφου.' });
  }

  const students = getStudents();
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return res.status(404).json({ error: 'Ο μαθητής δεν βρέθηκε.' });
  }

  // Re-verify password for API call security
  if (!verifyPassword(student, password)) {
    return res.status(401).json({ error: 'Μη εξουσιοδοτημένη ενέργεια.' });
  }

  // Save the votes
  const allVotes = getVotes();
  
  // Validate that voted student IDs are valid
  const validatedVotes = {};
  for (const catId of Object.keys(votes)) {
    // Check if category is valid
    if (!categories.some(c => c.id === catId)) continue;

    const votedStudentId = votes[catId];
    if (votedStudentId) {
      // SECURITY: A user cannot vote for themselves!
      if (votedStudentId === studentId) continue;

      const exists = students.some(s => s.id === votedStudentId);
      if (exists) {
        validatedVotes[catId] = votedStudentId;
      }
    }
  }

  allVotes[studentId] = validatedVotes;
  saveVotes(allVotes);

  res.json({ success: true, message: 'Οι ψήφοι σας αποθηκεύτηκαν με επιτυχία!' });
});

// Get aggregated voting results (leaderboard)
app.get('/api/results', (req, res) => {
  const { password } = req.query;
  if (password !== 'Papaioannou1978') {
    return res.status(401).json({ error: 'Λανθασμένο συνθηματικό αποτελεσμάτων.' });
  }

  const students = getStudents();
  const allVotes = getVotes();
  
  // Map to hold counts: { [categoryId]: { [votedStudentId]: voteCount } }
  const counts = {};
  categories.forEach(cat => {
    counts[cat.id] = {};
  });

  // Calculate total voters
  const totalVotersCount = Object.keys(allVotes).length;

  // Aggregate
  Object.values(allVotes).forEach(studentVotes => {
    Object.entries(studentVotes).forEach(([catId, votedStudentId]) => {
      if (counts[catId]) {
        counts[catId][votedStudentId] = (counts[catId][votedStudentId] || 0) + 1;
      }
    });
  });

  // Convert to formatted results with student details
  const results = categories.map(cat => {
    const nomineesMap = counts[cat.id];
    const nominees = Object.entries(nomineesMap).map(([votedStudentId, voteCount]) => {
      const studentDetails = students.find(s => s.id === votedStudentId);
      return {
        id: votedStudentId,
        fullName: studentDetails ? studentDetails.fullName : 'Άγνωστος/η',
        class: studentDetails ? studentDetails.class : '-',
        votes: voteCount
      };
    }).sort((a, b) => b.votes - a.votes); // Sort descending by vote count

    return {
      category: cat.label,
      categoryId: cat.id,
      emoji: cat.emoji,
      nominees: nominees
    };
  });

  res.json({
    totalVoters: totalVotersCount,
    totalStudents: students.length,
    results: results
  });
});

// Export Results to Excel
app.get('/api/admin/export', async (req, res) => {
  const { password } = req.query;
  if (password !== 'Papaioannou1978') {
    return res.status(401).send('Μη εξουσιοδοτημένη πρόσβαση.');
  }

  try {
    const students = getStudents();
    const allVotes = getVotes();

    const counts = {};
    categories.forEach(cat => {
      counts[cat.id] = {};
    });

    Object.values(allVotes).forEach(studentVotes => {
      Object.entries(studentVotes).forEach(([catId, votedStudentId]) => {
        if (counts[catId]) {
          counts[catId][votedStudentId] = (counts[catId][votedStudentId] || 0) + 1;
        }
      });
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Voting App';
    workbook.lastModifiedBy = 'School Voting App';
    workbook.created = new Date();

    // Sheet 1: General Summary of Winners
    const summarySheet = workbook.addWorksheet('Νικητές ανά Κατηγορία');
    summarySheet.columns = [
      { header: 'Κατηγορία', key: 'category', width: 30 },
      { header: 'Νικητής/Νικήτρια', key: 'winner', width: 30 },
      { header: 'Τμήμα', key: 'class', width: 15 },
      { header: 'Ψήφοι', key: 'votes', width: 15 }
    ];

    // Format headers
    summarySheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo color
    };

    categories.forEach(cat => {
      const nomineesMap = counts[cat.id];
      const nominees = Object.entries(nomineesMap).map(([votedStudentId, voteCount]) => {
        const studentDetails = students.find(s => s.id === votedStudentId);
        return {
          fullName: studentDetails ? studentDetails.fullName : 'Άγνωστος/η',
          class: studentDetails ? studentDetails.class : '-',
          votes: voteCount
        };
      }).sort((a, b) => b.votes - a.votes);

      const winner = nominees[0];
      summarySheet.addRow({
        category: `${cat.emoji} ${cat.label}`,
        winner: winner ? winner.fullName : 'Κανένας/Καμία ψήφος',
        class: winner ? winner.class : '-',
        votes: winner ? winner.votes : 0
      });
    });

    // Sheet 2: Detailed Breakdown
    const detailedSheet = workbook.addWorksheet('Αναλυτικά Αποτελέσματα');
    detailedSheet.columns = [
      { header: 'Κατηγορία', key: 'category', width: 30 },
      { header: 'Υποψήφιος/α', key: 'candidate', width: 30 },
      { header: 'Τμήμα', key: 'class', width: 15 },
      { header: 'Ψήφοι', key: 'votes', width: 15 }
    ];

    detailedSheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    detailedSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate color
    };

    categories.forEach(cat => {
      const nomineesMap = counts[cat.id];
      const nominees = Object.entries(nomineesMap).map(([votedStudentId, voteCount]) => {
        const studentDetails = students.find(s => s.id === votedStudentId);
        return {
          fullName: studentDetails ? studentDetails.fullName : 'Άγνωστος/η',
          class: studentDetails ? studentDetails.class : '-',
          votes: voteCount
        };
      }).sort((a, b) => b.votes - a.votes);

      if (nominees.length === 0) {
        detailedSheet.addRow({
          category: `${cat.emoji} ${cat.label}`,
          candidate: 'Κανένας/Καμία ψήφος',
          class: '-',
          votes: 0
        });
      } else {
        nominees.forEach(nom => {
          detailedSheet.addRow({
            category: `${cat.emoji} ${cat.label}`,
            candidate: nom.fullName,
            class: nom.class,
            votes: nom.votes
          });
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=voting_results_2026.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Σφάλμα κατά την εξαγωγή των αποτελεσμάτων.' });
  }
});

// Serve frontend main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

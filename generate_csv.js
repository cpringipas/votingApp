const fs = require('fs');
const path = require('path');

const studentsPath = path.join(__dirname, 'students.json');
if (!fs.existsSync(studentsPath)) {
    console.error('students.json not found!');
    process.exit(1);
}

const students = JSON.parse(fs.readFileSync(studentsPath, 'utf-8'));

// Sort by Class then by Full Name
students.sort((a, b) => {
    const classCompare = a.class.localeCompare(b.class);
    if (classCompare !== 0) return classCompare;
    return a.fullName.localeCompare(b.fullName, 'el');
});

// CSV Header
// We will use semicolon ';' as separator because Excel in Greek/European locales expects semicolons for CSV
let csvContent = '\uFEFF'; // UTF-8 BOM for Greek character compatibility in Excel
csvContent += 'Ονοματεπώνυμο;Τμήμα;Επίθετο;Κωδικός_Ελληνικά;Κωδικός_Λατινικά_1;Κωδικός_Λατινικά_2\n';

students.forEach(student => {
    const fullName = student.fullName;
    const cls = student.class;
    const surname = student.surname;
    
    const uniquePasswords = Array.from(new Set(student.passwords));
    const greekPass = uniquePasswords[0] || '';
    const latinPass1 = uniquePasswords[1] || '';
    const latinPass2 = uniquePasswords[2] || '';
    
    // Add row (escaping any quotes if necessary, though these names don't have quotes)
    csvContent += `"${fullName}";"${cls}";"${surname}";"${greekPass}";"${latinPass1}";"${latinPass2}"\n`;
});

const outputPath = path.join(__dirname, 'student_passwords.csv');
fs.writeFileSync(outputPath, csvContent, 'utf-8');
console.log(`Successfully generated CSV file at ${outputPath}!`);

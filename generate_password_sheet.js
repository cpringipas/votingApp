const fs = require('fs');
const path = require('path');

const studentsPath = path.join(__dirname, 'students.json');
if (!fs.existsSync(studentsPath)) {
    console.error('students.json not found!');
    process.exit(1);
}

const students = JSON.parse(fs.readFileSync(studentsPath, 'utf-8'));

// Group by Class
const groups = {};
students.forEach(s => {
    if (!groups[s.class]) {
        groups[s.class] = [];
    }
    groups[s.class].push(s);
});

const classes = Object.keys(groups).sort();
let outputText = '==================================================\n';
outputText += '      ΚΑΤΑΣΤΑΣΗ ΣΥΝΘΗΜΑΤΙΚΩΝ ΜΑΘΗΤΩΝ (2026)       \n';
outputText += '==================================================\n\n';

classes.forEach(cls => {
    outputText += `--------------------------------------------------\n`;
    outputText += `  ΤΜΗΜΑ ${cls}\n`;
    outputText += `--------------------------------------------------\n`;
    
    // Sort students alphabetically
    const classStudents = groups[cls].sort((a, b) => a.fullName.localeCompare(b.fullName, 'el'));
    
    classStudents.forEach((student, index) => {
        const num = String(index + 1).padStart(2, '0');
        outputText += `${num}. ${student.fullName.padEnd(45)} => `;
        
        // Show unique passwords
        const uniquePasswords = Array.from(new Set(student.passwords));
        outputText += uniquePasswords.join('  ή  ') + '\n';
    });
    outputText += '\n';
});

const outputPath = path.join(__dirname, 'student_passwords_list.txt');
fs.writeFileSync(outputPath, outputText, 'utf-8');
console.log(`Successfully generated password sheet at ${outputPath}!`);

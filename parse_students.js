const fs = require('fs');
const path = require('path');

const rawData = `Τμήμα Γ01
  Αγριδιώτης Ανδρέας
  Ανδρέου Κυριάκος
  Ανδρέου Μάρκος
  Αποστολόπουλος Στέφανος
  Γιαννούδη Κυριακή
  Διομήδους Κωνσταντίνος
  Θεμιστοκλέους Ελεονώρα
  Θεοφάνους Κυριάκος
  Θωμά Αντρέας
  Ιωαννίδου Ελένη
  Κριστέα Θεοδώρα
  Κυπριανού Νεφέλη Ειρήνη
  Κωνσταντινίδου Ελπίδα
  Κωνσταντίνου Ζωή
  Παναγιώτου Χρίστος
  Παπαμιχαήλ Ανδρέας
  Πήττα Μαρία
  Σωφρονίου Ιάκωβος
  Ταράου Μπριάνα Αντρέα
  Ταράου Ραϊσα Στεφανία
  Φλωρής Ιωάννης
  Χρυσοστόμου Μαρία
  Τμήμα Γ02
  Αντωνίου Κωνσταντίνα
  Γεωργίου Φαίδρα
  Γεωργίου Χριστόφορος
  Γιάγκου Κυριάκος
  Θεοφάνους Αντριάνα
  Ιωάννου Ανδρέας
  Κούβαρου Ειρήνη
  Κουφκή Κορίνα
  Κυπριανού Θεοδώρα
  Κωνσταντίνου Κωνσταντίνος
  Μεττή Αναστασία
  Ντιμίτροβα Κιάρα Βάλερη
  Παϊσιου Χάρις
  Παντελή Γιώργος
  Παντελίδης Γιώργος
  Σιαμπαρτάς Κρίστιαν
  Σιαξιατέ Αντριανή
  Σταυρίδου Τατιάνα
  Τζιωνής Γιώργος
  Χαραλαμπίδης Χάρης
  Χατζηαποστόλου Σωτήριος
  Χατζησολωμού Κυριάκος
  Τμήμα Γ03
  Αμπαζόγχλι Σιχάμ Ανδριάνα
  Αναστασίου Χρίστος-Άγγελος
  Βαλαωρίτου Ιωάννα
  Βανέζη Αντρέας
  Γαλαξή Μαρία Αιμιλία
  Γιώρκα Γιώργος
  Δρουσιώτης Δημήτρης
  Ελευθερίου Ελευθέριος
  Ζάνος Στέφανος
  Ιωάννου Χαράλαμπος
  Καταλάνου Παναγιώτης
  Κατσαρός Γεώργιος
  Μαυρομμάτης Νικόλας
  Ξενοφώντος Βάσια
  Ξενοφώντος Δήμητρα
  Ξενοφώντος Ξένια
  Οικονομίδου Σωτηρούλλα
  Παπαλλή Άντρια
  Σιάτη Στυλιανή
  Σπυροπούλου Ελένη
  Φραγκούδης Στέφανος
  Τμήμα Γ04
  Αναστόπουλος Στέφανος
  Αριστείδου Χρίστος
  Δαμιανού Άντρια
  Επισκοπίδου Σώτια Λητώ
  Ζήνωνος Βικτώρια
  Θρασυβούλου Χρίστος
  Κασσιανού Βαλέρια
  Κιουρουπεπιλάτσε Κριστιάλα Σιενέχα Μιτούσι
  Κούκουρα Άνθη
  Κώστα Γιώργος
  Μαρκίδη Δέσποινα
  Νικολάου Ραφαήλια
  Παρμακλή Λυδία
  Πλουτάρχου Κωνσταντίνος
  Πολυδώρου Μιχάλης
  Σταυρινίδου Ιωάννα
  Σωτηρίου Αναστάσιος
  Τσιουρτή Μαρίλια
  Χουσεϊν Σαμάν Τζιουάν
  Χρίστου Έλληνας Ματθαίος
  Χριστοφίδου Χρυσοβαλάντω
  Τμήμα Γ05
  Αρτεμίου Εύη
  Γεωργίου Τάσος
  Θεοδώρου Άννα
  Καρόνια Ελένη
  Κυπριανού Ιωάννης
  Κυπριανού Φίλιππος
  Κυριάκου Νικολέτα
  Κωτσονοπούλου Άλκηστις
  Μιλτιάδου Ανδρέας
  Μιλτιάδου Μαρία
  Μιχαήλ Νέστορας
  Νικολαϊδη Νικολέττα
  Παντελίδης Ανδρέας
  Πέρδικου Μαρία
  Πέτρου Πέτρος
  Σάββα Χρίστος
  Σταυρινού Μαρία
  Στρατής Μάριος
  Σωτηρίου Στυλιανός
  Ταμανάς Μάριος
  Τσεριώτη Ανθή
  Χαραλάμπους Αντριάνα
  Χρίστου Χριστίνα
  Χρυσάφης Αντώνιος
  Τμήμα Γ06
  Ανδρέου Ανδρέας
  Αντρέου Δημήτρης
  Αντρέου Ρωσσίδη Κωνσταντίνος
  Ελευθεριάδης Γιάννης
  Ιωάννου Ευγενία
  Καμμάς Άγγελος
  Καρά Μαρίνα
  Κιζουρίδης Άγγελος
  Κυπριανού Στέφανος
  Κωνσταντινίδης Μάριος
  Κωνσταντίνου Ευανθία
  Λάμπρου Κυριακή
  Λάμπρου Παρασκευή
  Λυσάνδρου Ιωάννης
  Μουντούρη Γεωργία
  Νταρλαγιάννη Εύη
  Παπασταύρου Χρήστος
  Πιττάλης Χριστόφορος
  Ρουβήμ Φωτεινή
  Χατζηανδρέου Χρυσοβαλάντης
  Χατζηαντώνη Κωνσταντίνος
  Χατζηγιάννη Όλγα
  Τμήμα Γ07
  Αλ Τζιμπάουι Νάταλυ
  Βασιλείου Έρικα Ιωάννα
  Βασιλείου Πέτρος
  Γρηγορίου Μιχαηλίνα
  Δαλίτης Αντώνης
  Δοντά Ευαγγελία
  Ζυμαρά Παναγιώτης
  Κανελλίδου Σιμώνη
  Μαρκίδης Κωνσταντίνος
  Μαυροβουνιώτης Παναγιώτης
  Παπαπέτρου Σίμος
  Ποπέσκου Βικτώρια Μαρία Φελίσια
  Πρίγκιπα Ζώη
  Σάββα Νίκη
  Σκοτεινού Ειρήνη
  Σταυρινού Παναγιώτα
  Τουλούμης Αντρέας
  Φλοκκά Δανάη
  Χρίστου Εβελίνα Αντωνία`;

// Greek to Latin (Greeklish) mapping for normalization
function toGreeklish(str) {
    if (!str) return '';
    
    // Normalize and remove Greek accents/diacritics
    let normalized = str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    
    // Character-by-character translation map
    const mapping = {
        'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
        'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
        'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps',
        'ω': 'o'
    };
    
    // Apply multi-character combinations
    normalized = normalized.replace(/ου/g, 'ou');
    normalized = normalized.replace(/αι/g, 'ai');
    normalized = normalized.replace(/ει/g, 'ei');
    normalized = normalized.replace(/οι/g, 'oi');
    normalized = normalized.replace(/μπ/g, 'mp'); // primary 'mp'
    normalized = normalized.replace(/ντ/g, 'nt'); // primary 'nt'
    normalized = normalized.replace(/τζ/g, 'tz');
    normalized = normalized.replace(/τσ/g, 'ts');
    normalized = normalized.replace(/αυ/g, 'av'); // simplified
    normalized = normalized.replace(/ευ/g, 'ev'); // simplified
    
    let result = '';
    for (let char of normalized) {
        result += mapping[char] || char;
    }
    
    return result;
}

const lines = rawData.split('\n');
const students = [];
let currentClass = '';
let idCounter = 1;

for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line.startsWith('Τμήμα')) {
        currentClass = line.replace('Τμήμα', '').trim();
    } else {
        // It's a student name
        // Surnames are usually the first word, but some names have multi-word surnames like "Αλ Τζιμπάουι"
        let surname = '';
        let firstNames = '';
        
        if (line.startsWith('Αλ Τζιμπάουι')) {
            surname = 'Αλ Τζιμπάουι';
            firstNames = line.replace('Αλ Τζιμπάουι', '').trim();
        } else {
            const parts = line.split(/\s+/);
            surname = parts[0];
            firstNames = parts.slice(1).join(' ');
        }
        
        // Generate password alternatives
        const rawSurnameGreek = surname.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const rawSurnameGreeklish = toGreeklish(surname);
        
        // We'll also handle common Greeklish replacements, e.g. v -> b, nt -> d, mp -> b
        const greeklishAlternatives = [rawSurnameGreeklish];
        
        if (rawSurnameGreeklish.includes('v')) {
            greeklishAlternatives.push(rawSurnameGreeklish.replace(/v/g, 'b'));
        }
        if (rawSurnameGreeklish.includes('nt')) {
            greeklishAlternatives.push(rawSurnameGreeklish.replace(/nt/g, 'd'));
        }
        if (rawSurnameGreeklish.includes('mp')) {
            greeklishAlternatives.push(rawSurnameGreeklish.replace(/mp/g, 'b'));
        }
        if (rawSurnameGreeklish.includes('y')) {
            greeklishAlternatives.push(rawSurnameGreeklish.replace(/y/g, 'i'));
        }
        
        // Remove duplicates and filter empty
        const cleanGreeklishAlts = Array.from(new Set(greeklishAlternatives)).filter(Boolean);
        
        students.push({
            id: `student_${idCounter++}`,
            fullName: line,
            class: currentClass,
            surname: surname,
            firstNames: firstNames,
            passwords: [
                `${rawSurnameGreek}2026`, // e.g. σαββα2026
                ...cleanGreeklishAlts.map(alt => `${alt}2026`) // e.g. savva2026, sabba2026, konstantinidou2026, konstadinidou2026
            ]
        });
    }
}

// Ensure dir exists
const dirPath = 'C:\\Users\\Lenovo\\school_voting_app';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

fs.writeFileSync(
    path.join(dirPath, 'students.json'),
    JSON.stringify(students, null, 2),
    'utf-8'
);

console.log(`Successfully parsed ${students.length} students across sections!`);

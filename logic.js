export const email = 'axilleasgrachilles@gmail.com';

export function validateInterval(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return { valid: false, message: 'Enter a positive whole number of minutes.' };
  const minutes = Number(text);
  if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 2147483647) {
    return { valid: false, message: 'Use a whole number from 1 to 2,147,483,647.' };
  }
  return { valid: true, minutes };
}

export function matchingCommands(commands, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return commands
    .filter(command => terms.every(term => `${command.label} ${command.keywords || ''}`.toLowerCase().includes(term)))
    .map(command => ({ command, score: terms.filter(term => command.label.toLowerCase().includes(term)).length }))
    .sort((a, b) => b.score - a.score)
    .map(({ command }) => command);
}

export function terminalResponse(input) {
  const command = input.trim().toLowerCase();
  const responses = {
    help: 'Commands: about, skills, projects, guardian, contact, github, clear, exit\nTip: use ↑ / ↓ to browse command history.',
    about: 'Achilleas Botsidis\nEntry-level backend developer · Thessaloniki, Greece\nStudying Web Development at SAEK ALFA. IT support internship at dbsoft.\nLooking for a trainee or junior development role.',
    skills: 'BACKEND     C# / .NET · Java\nPRACTICE    Console apps · Input validation · File I/O\nTOOLS       VS Code · Fedora Linux · Windows\nEXPOSURE    HTML / CSS · Python',
    projects: '01  Guardian — C# / .NET break-reminder console application\n    github.com/Th3Duckman/AFK-Guardian\n02  Basic Converter — Java KB-to-MB converter\n    github.com/Th3Duckman/Basic-Converter\n03  This portfolio — HTML, CSS, JavaScript & Canvas\n\nType guardian to open the interactive project walkthrough.',
    contact: `EMAIL       ${email}\nGITHUB      github.com/Th3Duckman\nLINKEDIN    linkedin.com/in/achilleas-botsidis-85091539a`,
    github: 'github.com/Th3Duckman',
    sudo: 'Permission granted to keep learning. That is the whole idea.',
    whoami: 'A curious human looking behind the interface. Welcome.',
  };
  if (Object.hasOwn(responses, command)) return responses[command];
  return command ? `Unknown command: ${input.trim()}. Type help to see what you can do.` : '';
}

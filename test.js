
const originalObject = { name: "ron", number: 70 };
const arrayOfObjects = [
    { totalStudents: 14, email: 'thompsonperformance@gmail.com' },
    { totalStudents: 18, email: 'robertsathletecoach@gmail.com' },
    { totalStudents: 25, email: 'campbellstrengthcoach@gmail.com' },
    { totalStudents: 20, email: 'baileysportscience@gmail.com' },
    { totalStudents: 30, email: 'johnsoncoaching@gmail.com' },
    { totalStudents: 23, email: 'andersonsports@gmail.com' }
  ];

// Populate the array of objects
// for (let i = 1; i <= 4; i++) {
//   arrayOfObjects.push({ name: `ron${i}`, number: 70 + i });
// }

// Sort the array based on the 'number' property in descending order
arrayOfObjects.sort((a, b) => b.totalStudents - a.totalStudents);

// Print the names
arrayOfObjects.forEach(obj => {
  console.log(obj.name);
});

console.log(arrayOfObjects);
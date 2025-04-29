const express = require('express');
const morgan = require('morgan');
const app = express();

// Käytetään express.json(), jotta POST-pyynnön data on saatavilla
app.use(express.json());

// Määritellään morganin loggaustyyli, joka näyttää myös requestin bodyn
morgan.token('body', (req) => JSON.stringify(req.body));  // Muista lisätä return

// Käytetään morgan middlewarea, joka loggaa kaikki saapuvat HTTP-pyynnöt
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

let persons = [
  { id: "1", name: "Arto Hellas", number: "040-123456" },
  { id: "2", name: "Ada Lovelace", number: "39-44-5323523" },
  { id: "3", name: "Dan Abramov", number: "12-43-234345" },
  { id: "4", name: "Mary Poppendieck", number: "39-23-6423122" },
  { id: "5", name: "John Doe", number: "123-456-7890" }
];

// Reitit
app.get('/', (request, response) => {
  response.send('Hello World!');
});

app.get('/api/persons', (request, response) => {
  response.json(persons);
});

app.get('/api/info', (request, response) => {
  const date = new Date();
  const info = `<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`;
  response.send(info);
});

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id;
  const personId = persons.find(person => person.id === id);
  if (personId) {
    response.json(personId);
  } else {
    response.status(404).send({ error: 'Person not found' });
  }
});

app.delete('/api/persons/:id', (request, response) => {
  const id = request.params.id;
  persons = persons.filter(person => person.id !== id);
  response.status(204).end();
});

app.post('/api/persons', (request, response) => {
  const newPerson = request.body;
  if (!newPerson.name || !newPerson.number) {
    console.log('Name or number is missing');
    return response.status(400).json({ error: 'Name or number is missing' });
  }
  const personExists = persons.some(person => person.name === newPerson.name);
  if (personExists) {
    console.log('Name must be unique');
    return response.status(400).json({ error: 'Name must be unique' });
  }
  newPerson.id = (Math.random() * 1000).toFixed(2).toString();
  persons.push(newPerson);
  response.status(201).json(newPerson);
});

// Tuntemattomat reitit
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

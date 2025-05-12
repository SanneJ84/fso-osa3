require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const Person = require('./models/person'); // Person-malli
const app = express();
const path = require('path');

// Käytetään express.json(), jotta POST-pyynnön data on saatavilla
app.use(express.json());
app.use(cors());  // Käytetään CORSia, jotta voidaan tehdä pyyntöjä eri domaineista
app.use(express.static('dist'));  // Käytetään staattista tiedostopalvelinta, jotta voimme palvella HTML-tiedostoja

// Määritellään morganin loggaustyyli, joka näyttää myös requestin bodyn
morgan.token('body', (req) => JSON.stringify(req.body));

// Käytetään morgan middlewarea, joka loggaa kaikki saapuvat HTTP-pyynnöt
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

// Reitit

// Kaikkien henkilöiden hakeminen
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
});

// Yksittäisen henkilön hakeminen ID:n perusteella
app.get('/api/persons/:id', (request, response) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).send({ error: 'Person not found' })
    }
  })
});

// Henkilön poistaminen
app.delete('/api/persons/:id', (request, response) => {
  Person.findByIdAndRemove(request.params.id).then(result => {
    if (result) {
      response.status(204).end()
    } else {
      response.status(404).send({ error: 'Person not found' })
    }
  })
});

// Uuden henkilön lisääminen
app.post('/api/persons', (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'Name or number is missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
});

// Tietoa puhelinluettelosta
app.get('/api/info', (request, response) => {
  const date = new Date();
  Person.countDocuments({}).then(count => {
    const info = `<p>Phonebook has info for ${count} people</p><p>${date}</p>`;
    response.send(info);
  })
});

// Alkunäkymä
app.get('/', (req, res) => {    
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Tuntemattomat reitit
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

// Palvelimen käynnistys
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

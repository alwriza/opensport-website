import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://xqeaivaznqkxdzigbfen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZWFpdmF6bnFreGR6aWdiZmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjIwMjksImV4cCI6MjA4MzI5ODAyOX0.kXOcObGAslX3s9lb04CgOU2B3dKYZ5ZhOZYEYzY7ock';

const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian', 'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey', 'Frank', 'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis', 'Walter', 'Patrick', 'Peter', 'Harold', 'Douglas', 'Henry', 'Carl', 'Arthur', 'Ryan', 'Roger', 'Mary', 'Patricia', 'Linda', 'Barbara', 'Elizabeth', 'Jennifer', 'Maria', 'Susan', 'Margaret', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Jessica', 'Shirley', 'Cynthia', 'Angela', 'Melissa', 'Brenda', 'Amy', 'Anna', 'Rebecca', 'Virginia', 'Kathleen', 'Pamela', 'Martha', 'Debra', 'Amanda', 'Stephanie', 'Carolyn', 'Christine', 'Marie', 'Janet', 'Catherine', 'Frances', 'Ann', 'Joyce', 'Diane', 'Alice', 'Julie', 'Heather', 'Teresa', 'Doris', 'Gloria', 'Evelyn', 'Jean', 'Cheryl', 'Mildred'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzales', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'];

const countriesAndCities = {
    'England': ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'],
    'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán'],
    'Portugal': ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'],
    'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Toluca'],
    'Uruguay': ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera'],
    'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
    'Chile': ['Santiago', 'Puente Alto', 'Maipú', 'Antofagasta', 'Viña del Mar']
};
const countries = Object.keys(countriesAndCities);

const positions = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const TOTAL_TARGET_USERS = 150;

async function generate() {
    console.log('Fetching existing users...');
    const { data: existingUsers, error: fetchError } = await supabase.from('users').select('*');
    if (fetchError) {
        console.error('Error fetching existing users:', fetchError);
        return;
    }

    let allUsers = [...(existingUsers || [])];
    const existingCount = allUsers.length;
    console.log(`Found ${existingCount} existing users.`);

    // Check existing analyses to optionally skip users, but we decided to just add new analyses to make it rich

    const usersToGenerate = Math.max(0, TOTAL_TARGET_USERS - existingCount);

    if (usersToGenerate > 0) {
        console.log(`Generating ${usersToGenerate} mock users...`);
        const newUsers = [];

        for (let i = 0; i < usersToGenerate; i++) {
            const country = getRandomItem(countries);
            const city = getRandomItem(countriesAndCities[country]);
            const firstName = getRandomItem(firstNames);
            const lastName = getRandomItem(lastNames);

            newUsers.push({
                clerk_id: `mock_clerk_${crypto.randomUUID()}`,
                email: `mock_${crypto.randomUUID()}@example.com`,
                name: `${firstName} ${lastName}`,
                role: 'player',
                age: getRandomInt(14, 30),
                position: getRandomItem(positions),
                country: country,
                city: city,
                club: `FC ${city}`
            });
        }

        // Insert in batches of 50
        for (let i = 0; i < newUsers.length; i += 50) {
            const batch = newUsers.slice(i, i + 50);
            const { data: insertedUsers, error: insertError } = await supabase
                .from('users')
                .insert(batch)
                .select();

            if (insertError) {
                console.error(`Error inserting batch ${i / 50 + 1}:`, insertError);
            } else if (insertedUsers) {
                allUsers.push(...insertedUsers);
                console.log(`Inserted batch ${i / 50 + 1} (${insertedUsers.length} users).`);
            }
        }
    } else {
        console.log('We already have 150 or more users. No mock users generated.');
    }

    console.log(`Now we have ${allUsers.length} users in total. Generating analyses...`);

    let totalAnalysesInserted = 0;
    const generatedAnalyses = [];

    for (const user of allUsers) {
        const analysesCount = getRandomInt(1, 5); // 1 to 5 analyses per user
        const baseSkill = getRandomInt(40, 95);

        for (let i = 0; i < analysesCount; i++) {
            generatedAnalyses.push({
                user_id: user.id,
                stability: Math.min(100, Math.max(0, baseSkill + getRandomInt(-10, 10))),
                power: Math.min(100, Math.max(0, baseSkill + getRandomInt(-15, 15))),
                technique: Math.min(100, Math.max(0, baseSkill + getRandomInt(-10, 10))),
                balance: Math.min(100, Math.max(0, baseSkill + getRandomInt(-10, 10))),
                overall: Math.min(100, Math.max(0, baseSkill + getRandomInt(-5, 5))),
                feedback: `Generated mock analysis. Consistent performance noted in technique. Focus on improving precision under pressure.`,
                processing_time_ms: getRandomInt(2000, 8000),
            });
        }
    }

    // Insert analyses in batches of 50
    for (let i = 0; i < generatedAnalyses.length; i += 50) {
        const batch = generatedAnalyses.slice(i, i + 50);
        const { error: analysisInsertError } = await supabase.from('analyses').insert(batch);

        if (analysisInsertError) {
            console.error(`Error inserting analyses batch ${i / 50 + 1}:`, analysisInsertError);
        } else {
            totalAnalysesInserted += batch.length;
            if (totalAnalysesInserted % 200 === 0 || i + 50 >= generatedAnalyses.length) {
                console.log(`Inserted ${totalAnalysesInserted} / ${generatedAnalyses.length} analyses...`);
            }
        }
    }

    console.log(`Done! Successfully inserted ${totalAnalysesInserted} analyses for ${allUsers.length} users.`);
}

generate().catch(console.error);

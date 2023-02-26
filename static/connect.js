(async() => {
    const neo4j = require('neo4j-driver');
    const uri = 'neo4j+s://19821f8e.databases.neo4j.io';
    const user = 'neo4j';
    const password = 'seQUFK2lRJSO6IBcI2C2HZNUgKZX9Usmeo9DUGf9GUQ';
    // To learn more about the driver: https://neo4j.com/docs/javascript-manual/current/client-applications/#js-driver-driver-object
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    try {
        await getQuestions(driver);
        await getInDepthQuestions(driver);
        await getMainSymptoms(driver);
        await getAddSymptoms(driver);
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
    } finally {
        // Don't forget to close the driver connection when you're finished with it.
        await driver.close();
    }

    async function getQuestions(driver) {

        const session = driver.session({ database: 'neo4j' });

        try {
            const readQuery =   `MATCH (q:Question)-[:IS_QUESTION_ABOUT]->(s:Symptom)<-[:IS_INTENT_OF]-(i:Intent)
                                WHERE q.Required = true
                                RETURN collect([q.Text, i.hidden_value])`
                            
                            //`MATCH (q:Question)
                            //WHERE q.Required = true
                            //RETURN collect(q.Text)`
                           
            const readResult = await session.executeRead(tx =>
                tx.run(readQuery)
            );

            readResult.records.forEach(record => {
                var questionList = `${record.get('collect([q.Text, i.hidden_value])')}`;
                var qArray;
                let questions = questionList.toString();
                let test = questions.replace(/\?,/gm, "?");
                globalThis.window.qArray = test.split('?');
                module.exports = { qArray };
            });
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }

    async function getInDepthQuestions(driver) {

        const session = driver.session({ database: 'neo4j' });

        try {
            const readQuery = `MATCH (q:Question)<-[:BELONGS_TO]-(idq:InDepthQuestion)
                    RETURN collect([q.Text, idq.Text])`;

            const readResult = await session.executeRead(tx =>
                tx.run(readQuery)
            );

            readResult.records.forEach(record => {
                //console.log(`Found: ${record.get('q.Text')}` + ' + indepth question ' + `${record.get('idq.Text')}`)
                var indepthList = `${record.get('collect([q.Text, idq.Text])')}`;
                var idqArray;
                let indepths = indepthList.toString();
                let test = indepths.replace(/\?,/gm, "?");
                //idqArray = test.split('?');
                //console.log(idqArray);
                globalThis.window.idqArray = test.split('?');
                module.exports = { idqArray };
            });

        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }

    async function getMainSymptoms(driver) {

        const session = driver.session({ database: 'neo4j' });

        try {
            const readQuery =   `MATCH (s:Symptom)
                                WHERE s.Class = 'Main'
                                RETURN collect(s.Name)`;
                           
            const readResult = await session.executeRead(tx =>
                tx.run(readQuery)
            );

            readResult.records.forEach(record => {
                var symptomNames = `${record.get('collect(s.Name)')}`;
                var mainSymptoms;
                globalThis.window.mainSymptoms = symptomNames.toString().toLowerCase();
                module.exports = { mainSymptoms };
            });
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }
    async function getAddSymptoms(driver) {

        const session = driver.session({ database: 'neo4j' });

        try {
            const readQuery =   `MATCH (s:Symptom)
                                WHERE s.Class = 'Additional'
                                RETURN collect(s.Name)`;
                           
            const readResult = await session.executeRead(tx =>
                tx.run(readQuery)
            );

            readResult.records.forEach(record => {
                var addSymptomNames = `${record.get('collect(s.Name)')}`;
                var addSymptoms;
                globalThis.window.addSymptoms = addSymptomNames.toString().toLowerCase();
                module.exports = { addSymptoms };
            });
        } catch (error) {
            console.error(`Something went wrong: ${error}`);
        } finally {
            await session.close();
        }
    }
})();
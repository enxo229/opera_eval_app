import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyDJyP3t7FEvjHXoqiaCAXDcF0oyb2d01PI";
const genAI = new GoogleGenerativeAI(apiKey);

// Caso 1: Creatividad técnica (Generación de Escenario)
const promptGeneracion = `Actúa como un líder técnico de observabilidad. Genera un escenario de incidente técnico de Nivel 2 (caída de servidor o alto CPU) que el candidato debe investigar en un entorno Dynatrace/Grafana. Retorna solo el caso en 1 párrafo corto.`;

// Caso 2: Evaluación Analítica Estricta en JSON
const promptEvaluacion = `Eres un evaluador técnico. Evalúa esta respuesta de un candidato a la pregunta '¿Qué es Linux?': 'Es un programa gratis de un pingüino'. Usa la escala 0-3 (0: mal, 3: excelente). Responde ESTRICTA Y ÚNICAMENTE con un JSON con este formato exacto: [{"score": N, "justification": "tu análisis aquí"}]`;

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log(`\n=================================================`);
        console.log(` MODELO: ${modelName}`);
        console.log(`=================================================`);

        console.log(`\n--- PRUEBA 1: Generación de Escenario ---`);
        const resultGen = await model.generateContent(promptGeneracion);
        console.log(resultGen.response.text());

        console.log(`\n--- PRUEBA 2: Evaluación JSON Estricta ---`);
        const resultEval = await model.generateContent(promptEvaluacion);
        console.log(resultEval.response.text());

    } catch (err) {
        console.error(`Error with ${modelName}:`, err.message);
    }
}

async function runAll() {
    await testModel('gemma-3-27b-it');
    await testModel('gemma-3-12b-it'); // Let's test if it responds properly
}

runAll();

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyDJyP3t7FEvjHXoqiaCAXDcF0oyb2d01PI";
const genAI = new GoogleGenerativeAI(apiKey);

const prompt = `Eres un evaluador técnico. Evalúa esta respuesta de un candidato a la pregunta '¿Qué es Linux?': 'Linux es un sistema operativo de pingüinito muy seguro y de código abierto'. Usa la escala 0-3 (0: mal, 3: excelente). Responde ESTRICTA Y ÚNICAMENTE con un JSON con este formato exacto: [{"score": N, "justification": "tu análisis aquí"}]`;

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`\n=================================================`);
        console.log(` MODELO: ${modelName}`);
        console.log(`=================================================`);
        console.log(result.response.text());
    } catch (err) {
        console.error(`Error with ${modelName}:`, err.message);
    }
}

async function runAll() {
    await testModel('gemini-3.1-flash-lite-preview');
    await testModel('gemini-2.0-flash-lite');
    await testModel('gemma-3-27b-it');
}

runAll();

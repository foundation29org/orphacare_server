const { ChatOpenAI } = require("langchain/chat_models/openai");
const config = require('../config')
const insights = require('../services/insights');
const { Client } = require("langsmith")
const { LangChainTracer } = require("langchain/callbacks");
const { LLMChain } = require("langchain/chains");
const { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder } = require("langchain/prompts");

const AZURE_OPENAI_API_KEY = config.OPENAI_API_KEY;
const OPENAI_API_KEY = config.OPENAI_API_KEY_J;
const OPENAI_API_VERSION = config.OPENAI_API_VERSION;
const OPENAI_API_BASE = config.OPENAI_API_BASE;
const client = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: config.LANGSMITH_API_KEY,
});

function createModels(projectName) {
  const tracer = new LangChainTracer({
    projectName: projectName,
    client
  });
  
  const model = new ChatOpenAI({
    modelName: "gpt-4-0613",
    azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: OPENAI_API_BASE,
    azureOpenAIApiDeploymentName: "nav29",
    temperature: 0,
    timeout: 500000,
    callbacks: [tracer],
  });
  
  const model32k = new ChatOpenAI({
    modelName: "gpt-4-32k-0613",
    azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: OPENAI_API_BASE,
    azureOpenAIApiDeploymentName: "test32k",
    temperature: 0,
    timeout: 500000,
    callbacks: [tracer],
  });

  const model128k = new ChatOpenAI({
    modelName: "gpt-4-1106-preview",
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0,
    timeout: 500000,
    callbacks: [tracer],
  });
  
  return { model, model32k, model128k };
}

// This function will be a basic conversation with documents (context)
async function generate_items_for_disease(disease){
  return new Promise(async function (resolve, reject) {
    try {
      // Create the models
      const projectName = `${config.LANGSMITH_PROJECT}`;
      let { model, model32k, model128k } = createModels(projectName);
  

      const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(
        `You are a medical expert, based on this context from the patient.`
      );
  
      const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(
        `Make a list of ten items that are important to a patient with {disease_name}. It should be ten simple sentences that explain a problem that is important to the patient or their caregivers and that is an unmet medical need. They should be items that a drug or treatment could change. When the answer is a set of co-morbidities give the separate items.
        Return this python List with the top 10 most probable like "Patient-Reported Outcome Measures (PROMs)".
        Return only this list of PROMs, without any other text.
        ----------------------------------------
        Example: [{{ "name": "PROM1" }}, {{ "name": "PROM2" }}, {{ "name": "PROM3" }}, {{ "name": "PROM4" }}, {{ "name": "PROM5" }}, {{ "name": "PROM6" }}, {{ "name": "PROM7" }}, {{ "name": "PROM8" }}, {{ "name": "PROM9" }}, {{ "name": "PROM10" }}]
        ----------------------------------------
        PROM List:`
      );
  
      const chatPrompt = ChatPromptTemplate.fromMessages([systemMessagePrompt, humanMessagePrompt]);
     
      const chain = new LLMChain({
        prompt: chatPrompt,
        llm: model,
      });

      response = await chain.invoke({
        disease_name: disease,
      });

      // console.log(response);
      resolve(response);
    } catch (error) {
      console.log("Error happened: ", error)
      insights.error(error);
      var respu = {
        "msg": error,
        "status": 500
      }
      resolve(respu);
    }
  });
}

module.exports = {
    generate_items_for_disease,
};
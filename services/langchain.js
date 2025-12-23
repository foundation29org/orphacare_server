const { get } = require('request');
const config = require('../config')
const insights = require('../services/insights');
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY_EPAR // This is also the default, can be omitted
});

function extractAndParse(summaryText) {
  // Step 1: Extract Text using Regular Expressions
  let matches = summaryText.match(/<output>(.*?)<\/output>/s);
  if (!matches) {
    console.warn("No matches found in <output> tags.");
    return "[]";
  }

  // Assuming the content in <output> is JSON
  try {
    // Step 2: Convert Extracted Text to JSON
    const extractedJson = JSON.parse(matches[1]);  // Considering only the first match
    return JSON.stringify(extractedJson);
  } catch (error) {
    console.log(error)
    console.warn("Invalid JSON format in <output> tags.");
    return "Invalid JSON format";
  }
}

async function getInfo(req, res) {
  try {
    var condition = req.params.name;
    // You have to search what medicine leaflets are available in the documents
    // The return of this function should have two keys:
    // orphanDrugs and questionAnswers
    let prompt = `You have to search what medicine leaflets are available in the documents. The condition to search is: ${condition}. 
    You have to return the name of the medicines first and then generate 3 question and answer pairs relevant for those medicines and the condition.
    
    Output should ALWAYS ALWAYS be EXACTLY as the following output example in XML output tag with JSON inside:
    <output>
    {
    "orphanDrugs": [
      {
        "name": "Medicine 1 (and the active ingredient)"
      },
      ...
      {
        "name": "Medicine N (and the active ingredient)"
      },
    ]
    "questionsAnswers": [
      {
        "question": "Question 1",
        "answer": "Answer 1"
      },
      {
        "question": "Question 2", 
        "answer": "Answer 2"
      },
      {
        "question": "Question 3",
        "answer": "Answer 3"
      }
    ]
    }
    </output>
    `
    
    let messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const thread = await openai.beta.threads.create({
      messages: messages,
    });

    let threadId = thread.id;
    console.log('Created thread with Id: ' + threadId);

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: config.EPAR_ASSISTANT_ID,
      additional_instructions: '',
    });

    console.log('Run finished with status: ' + run.status);

    if (run.status == 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      let response = messages.getPaginatedItems()[0].content[0].text.value;
      console.log(response)
      let parsedResponse = extractAndParse(response);
      console.log(parsedResponse)
      res.status(200).send({ data: parsedResponse })
      // for (const message of messages.getPaginatedItems()) {
      //   console.log(message);
      // }
    } else {
      throw new Error("The run did not complete successfully.");
    }
  } catch (error) {
    console.error('Error occurred:', error);
    var respu = {
      "msg": 'error',
      "status": 500
    }
    res.status(500).send(respu)
  }
}

async function getAnswer(req, res) {
  // Now from a new question, based on the condition and the orphanDrugs, generate an answer based on the documents
  // The return of this function should be only the answer
  try {
    var condition = req.body.name;
    var question = req.body.question;
    var orphanDrugs = req.body.orphanDrugs;
    let prompt = `
    Based on their condition ${condition} and their medicines ${orphanDrugs}, generate an answer to the following question from the patient: ${question}
    
    Remember that the answer should be very easy to understand and concise. The objective is to help the user understand the condition and the medicine better.
    Based on the documents, you have to generate an answer to the question.

    <question>
    ${question}
    </question>

    Output should be just the answer, nothing else.
    Answer to the question.
    `
    
    let messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const thread = await openai.beta.threads.create({
      messages: messages,
    });

    let threadId = thread.id;
    console.log('Created thread with Id: ' + threadId);

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: config.EPAR_ASSISTANT_ID,
      additional_instructions: '',
    });

    console.log('Run finished with status: ' + run.status);

    if (run.status == 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      let response = messages.getPaginatedItems()[0].content[0].text.value;
      console.log(response)
      /*let parsedResponse = extractAndParse(response);
      console.log(parsedResponse)*/
      res.status(200).send({ data: response })
      // for (const message of messages.getPaginatedItems()) {
      //   console.log(message);
      // }
    } else {
      throw new Error("The run did not complete successfully.");
    }
  } catch (error) {
    console.error('Error occurred:', error);
    var respu = {
      "msg": 'error',
      "status": 500
    }
    res.status(500).send(respu)
  }
}


module.exports = {
  getInfo,
  getAnswer
};
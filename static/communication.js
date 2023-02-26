const inputField = document.getElementById("input");

inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let input = inputField.value;
    inputField.value = "";
    output(input);
  }
});

var text="";
var nextQuestion = "";
var lastQuestion = "";
var nextIdQuestion = "";
var nextRelatedQuestion = "";
var sentiment_index = 0;
var nlu_result = "";
var sentiment = "";
var mainSymptomsList = "";
var additionalSymptomsList = "";
var foundAdditionalSymptoms = 0;
var foundMainSymptoms = 0;
var foundSymptoms = [];
var intentRelatedQuestion = "";
var startOfDialogue = true;
var dialog_protocol = [];
var dialog_emotions = [];

async function output(input) {
  let product;
  text = input.toLowerCase().replace(/[^\w\s\d]/gi, "");
  text = text
    .replace(/ a /g, " ")
    .replace(/whats/g, "what is")
    .replace(/please /g, "")
    .replace(/ please/g, "")
    .replace(/r u/g, "are you");
  
  
  getSymptoms();

  sendUserAnswerToSentiment();
 
  const result = await getFeedback()
  const wait = await resolveAfter5Seconds();

  if (startOfDialogue) {
    product = startCommunication();
    getFirstInDepth();
    startOfDialogue = false;
  }

  else {

    if (sentiment > 3 || sentiment == "")
    { 
      if (nlu_result === "goodbye" || this.qArray.length <= 1) {
        product = endConversation();
      }

      else {
        while (nextRelatedQuestion === lastQuestion) {
          clearInDepths();
          foundSymptoms.pop();
          console.log("Gefundene Symptome: " + foundSymptoms)
          nextRelatedQuestion = this.idqArray[0] + "?";
          console.log("InDepth gelöscht")
        }
        product = getQuestion()
        console.log("Sentiment verlangt keine Vertiefung")
      }
    }
    else {
      console.log(this.idqArray);
      console.log ("Related: " + nextRelatedQuestion + " Question: " + lastQuestion)
      if (nextRelatedQuestion === lastQuestion) {
        product = getInDepth()
        console.log("Es gibt eine passende Vertiefungsfrage")
      }
      else {
        product = getQuestion()
        console.log("Es wurde keine passende Vertiefungsfrage mehr gefunden, daher folgt eine Standardfrage")
      }
    }

  }

  addChatEntry(input, product);
}

function startCommunication(){
  if (nlu_result === "accept") {
    return "How are you today?"
  }
  else {
    return "Ok, then. Have a nice day."
  }
}

function endConversation(){
    inputField.style.display = 'none';
    for (let i = 0; i < foundSymptoms.length; i++) {
      if (mainSymptomsList.indexOf(foundSymptoms[i],0) > 0){
        foundMainSymptoms++
        console.log(foundMainSymptoms)
      }
      if (additionalSymptomsList.indexOf(foundSymptoms[i],0) > 0){
        foundAdditionalSymptoms++
        console.log(foundAdditionalSymptoms)
      }
    }
    if (foundAdditionalSymptoms > 1 && foundMainSymptoms > 1) { 
      return "Thank you for answering my questions, I think that you are suffering from a depression. Please consult a doctor!"
    }
    else {
      return "Thank you for answering my questions, you can download your protocol if you want to. Have a nice day!"
    }
}

function getQuestion() {
  nlu_position = this.qArray.indexOf(nlu_result, 0)
  console.log("My NLU-Position: " + nlu_position)
  let next = ""
  if (nlu_position > -1) {
    next = this.qArray[nlu_position-1]
    lastQuestion = this.qArray[nlu_position-1] + "?";
    this.qArray.splice(nlu_position-1, 2)
    foundSymptoms.push(nlu_result.trim());
    console.log("Array after found NLU: " + this.qArray)
  }

  else {
    next = this.qArray[0];
    lastQuestion = this.qArray[0] + "?";
    foundSymptoms.push(this.qArray[1].trim());
    this.qArray.shift();
    this.qArray.shift();
  }
  
  nextQuestion = next + "?";
  intentRelatedQuestion = next;
  nextRelatedQuestion = nextQuestion;
  console.log(this.qArray);
  console.log(nextQuestion);
  dialog_protocol.push(nextQuestion);

  console.log("Gefundene Symptome: " + foundSymptoms)

  return nextQuestion
}

function getInDepth(){
  //richtige Vertiefungsfrage mit Bezug auf NLU stellen
  nextIndex = this.idqArray.indexOf(intentRelatedQuestion, 0)
  console.log("My next index: " + nextIndex)
  let next = ""
  if (nextIndex > 1) {
    next = this.idqArray[nextIndex+1];
    nextRelatedQuestion = this.idqArray[nextIndex] + "?";
    this.idqArray.splice(nextIndex, 2)
    console.log("Array after found question: " + this.idqArray)
  }
  else {
    next = this.idqArray[1];
    nextRelatedQuestion = this.idqArray[0] + "?";
    console.log(this.idqArray);
    this.idqArray.shift();
    this.idqArray.shift();
  }

  console.log(this.idqArray);
  nextIdQuestion = next + "?";
  //console.log(this.idqArray);
  console.log(nextIdQuestion);
  dialog_protocol.push(nextIdQuestion);
  return nextIdQuestion
}

function getFirstInDepth(){
  nextRelatedQuestion = this.idqArray[0] + "?";
}

function getSymptoms(){
  mainSymptomsList = this.mainSymptoms;
  additionalSymptomsList = this.addSymptoms;
  console.log(mainSymptomsList)
  console.log(additionalSymptomsList)
}

function clearInDepths(){
  this.idqArray.shift();
  this.idqArray.shift();
}

function addChatEntry(input, product) {
  const messagesContainer = document.getElementById("messages");
  let userDiv = document.createElement("div");
  userDiv.id = "user";
  userDiv.className = "user response";
  userDiv.innerHTML = `<p class="from-user">${input}</p>`;
  messagesContainer.appendChild(userDiv);

  let botDiv = document.createElement("div");
  let botText = document.createElement("p");
  botDiv.id = "messages";
  botDiv.className = "bot response";
  botText.className = "from-bot";
  botText.innerText = "Typing...";
  botDiv.appendChild(botText);
  messagesContainer.appendChild(botDiv);

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight - messagesContainer.clientHeight;

  setTimeout(() => {
    botText.innerText = `${product}`;
  }, 5000);
}

function sendUserAnswerToSentiment() {
  let userinfo = text;
  console.log(userinfo);
  const request = new XMLHttpRequest();
  request.open('POST', `/ProcessUserinfo/${JSON.stringify(userinfo)}`);
  dialog_protocol.push(userinfo);
  request.send();
}

function resolveAfter5Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, 5000);
  });
}

async function getFeedback() {
  console.log('calling');
  const result = await resolveAfter5Seconds();
  console.log(result);
  fetch(`/getdata/${sentiment_index}`)
  .then(function (response) {
      return response.text();
  }).then(function (text) {
      console.log('GET response text: ' + text);
      sentiment = text.charAt(0);
      nlu_result = text.substring(2);
      dialog_emotions.push(sentiment);
      dialog_protocol.push(nlu_result);
      console.log('Sentiment: ' + sentiment);
      console.log('NLU: ' + nlu_result);
      return sentiment, nlu_result
  });
  // Expected output: "resolved"
}

function download_protocol() {
  var hiddenElement = document.createElement('a');

  hiddenElement.href = 'data:attachment/text,' + encodeURI(dialog_protocol);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'myProtocol.txt';
  hiddenElement.click();

  var hiddenElement2 = document.createElement('a');

  hiddenElement2.href = 'data:attachment/text,' + encodeURI(dialog_emotions);
  hiddenElement2.target = '_blank';
  hiddenElement2.download = 'myProtocolEmotions.txt';
  hiddenElement2.click();
}

async function checkInDepth(){
    const result = await getFeedback();
    const wait = await resolveAfter5Seconds();
    if (sentiment < 4) {
      console.log('Should be indepth ' + sentiment)

      let next = this.idqArray[0];
      this.idqArray.shift();
      nextIdQuestion = next + "?";
      console.log(this.idqArray);
      dialog_protocol.push(nextIdQuestion);
      return nextIdQuestion
    }
    else {
      console.log('Should be standard' + sentiment)
    }
}

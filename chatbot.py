from flask import Flask, render_template, request, redirect, jsonify
import json

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import requests

from rasa.core.agent import Agent
import asyncio
import json

model_path = "models/20230203-165149-gray-crescendo.tar.gz"
agent = Agent.load(model_path)

app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ProcessUserinfo/<string:userinfo>',methods=['POST'])
def ProcessUserinfo(userinfo):
    userinfo=json.loads(userinfo)
    userAnswer=userinfo
    print()
    print(userAnswer)
    print()
    tokenizer = AutoTokenizer.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')
    model = AutoModelForSequenceClassification.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')

    tokens = tokenizer.encode(userAnswer, return_tensors='pt')

    result = model(tokens)
    global sentiment
    sentiment = int(torch.argmax(result.logits))+1

    print("Calculated Sentiment", sentiment)
    print("NLU model loaded.")
    try:
        print("Next message: " + userinfo)
        message = userinfo
    except (EOFError, KeyboardInterrupt):
        print("Wrapping up command line chat...")

    result = asyncio.run(agent.parse_message(message))
    result_json = json.dumps(result)
    result_data = json.loads(result_json)
    global nlu_result
    nlu_result = result_data['intent']['name']
    print ("Found intent: " + result_data['intent']['name']) 
    #print(json.dumps(result, indent=2))

    with open('automaticprotocol.txt', 'a') as f:
        f.write(userinfo + ',')
        f.write(nlu_result + ',')
        f.write(str(sentiment) + ',')
    
    with open('sentiment_log1.txt', 'a') as f:
        f.write(userinfo + ',')

    with open('sentiment_log2.txt', 'a') as f:
        f.write(str(sentiment) + ',')

    return ('/')

@app.route('/getdata/<index_no>', methods=['GET','POST'])
def data_get(index_no):
    data = [sentiment,nlu_result]
    print (data)

    if request.method == 'POST': # POST request
        print(request.get_text())  # parse as text
        return 'OK', 200
    
    else: # GET request
        return '%s,%s'%(data[int(index_no)],data[1])

if __name__ =='__main__':
    app.run(debug=True)
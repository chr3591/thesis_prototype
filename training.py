#-------------------PRE-PROCESSING---------------------------#
import torch
from transformers import AutoTokenizer
from numpy import loadtxt

tokenizer = AutoTokenizer.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')

#Read Answers From File
fileObj = open('sentiment_log1.txt', 'r')
text = fileObj.read()
sentences = text.split('.')
fileObj.close()
encoded_inputs = tokenizer(sentences, padding=True, truncation=True, return_tensors="pt")
print(encoded_inputs)

#Read Emotions From File
fileObj2 = open('sentiment_log2.txt', 'r')
text2 = fileObj2.read()
emotions = text2.split(',')
res = [eval(i) for i in emotions]
fileObj2.close()

#encoded_sentiments = tokenizer(emotions, padding=True, truncation=True, return_tensors="pt")

#Build Dataset
from datasets import load_dataset
class BERTTrainingSet(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, index):
        
        item = {key: torch.tensor(val[index]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[index])
        return item

    def __len__(self):
        return len(self.labels)

training_dataset = BERTTrainingSet(encoded_inputs, res)

#def tokenize_function(examples):
#    return tokenizer(examples["text"], padding="max_length", truncation=True)

#Trainer
from transformers import Trainer, TrainingArguments, DistilBertForSequenceClassification, AutoModelForSequenceClassification

training_args = TrainingArguments(
    output_dir='results',         
    num_train_epochs=3,              
    per_device_train_batch_size=16,  
    per_device_eval_batch_size=64,   
    warmup_steps=500,                
    weight_decay=0.01,               
    logging_dir='./logs',            
    logging_steps=10,
    max_steps=10,
)

model = AutoModelForSequenceClassification.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')
#model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased")

trainer = Trainer(
    model=model,                         # the instantiated 🤗 Transformers model to be trained
    args=training_args,                  # training arguments, defined above
    train_dataset=training_dataset,      # training dataset
)

trainer.train()
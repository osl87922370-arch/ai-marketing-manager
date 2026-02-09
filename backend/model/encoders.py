import torch
import torch.nn as nn
import torchvision.models as models
from transformers import AutoModel, AutoTokenizer

class TextEncoder(nn.Module):
    def __init__(self, model_name='roberta-base', hidden_dim=768, freeze_layers=True):
        super(TextEncoder, self).__init__()
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        
        if freeze_layers:
            for param in self.model.parameters():
                param.requires_grad = False
                
        self.fc = nn.Linear(768, hidden_dim)

    def forward(self, text_list):
        # Tokenize
        inputs = self.tokenizer(text_list, return_tensors='pt', padding=True, truncation=True, max_length=128)
        
        # Forward pass
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Get last hidden state: (Batch, Seq_Len, 768)
        last_hidden_state = outputs.last_hidden_state
        
        # Project to common dimension
        features = self.fc(last_hidden_state) # (Batch, Seq_Len, Hidden_Dim)
        return features, inputs.attention_mask

class ImageEncoder(nn.Module):
    def __init__(self, hidden_dim=768, freeze_layers=True):
        super(ImageEncoder, self).__init__()
        # Load VGG16
        vgg = models.vgg16(weights=models.VGG16_Weights.DEFAULT)
        # Remove classifier, keep feature extractor (Batch, 512, 7, 7)
        self.features = vgg.features
        
        if freeze_layers:
            for param in self.features.parameters():
                param.requires_grad = False
        
        # 1x1 Conv to project 512 channels to Hidden_Dim (768)
        self.projection = nn.Conv2d(512, hidden_dim, kernel_size=1)

    def forward(self, images):
        # images: (Batch, 3, 224, 224)
        x = self.features(images) # (Batch, 512, 7, 7)
        x = self.projection(x)    # (Batch, Hidden_Dim, 7, 7)
        
        # Flatten spatial dimensions: (Batch, Hidden_Dim, 49)
        # Permute to (Batch, 49, Hidden_Dim) to match text sequence format
        x = x.flatten(2).permute(0, 2, 1) 
        
        return x

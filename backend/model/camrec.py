import torch
import torch.nn as nn
from .encoders import TextEncoder, ImageEncoder
from .co_attention import CoAttention

class CAMRec(nn.Module):
    def __init__(self, text_model='roberta-base', hidden_dim=768, co_attn_dim=512, output_dim=1):
        super(CAMRec, self).__init__()
        
        self.text_encoder = TextEncoder(model_name=text_model, hidden_dim=hidden_dim)
        self.image_encoder = ImageEncoder(hidden_dim=hidden_dim)
        
        self.co_attention = CoAttention(hidden_dim=hidden_dim, co_attn_dim=co_attn_dim)
        
        # Fusion MLP
        self.mlp = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, output_dim)
        )

    def forward(self, text_list, images):
        """
        text_list: list of strings
        images: (Batch, 3, 224, 224)
        """
        # 1. Encode
        # text_feats: (B, L, D), text_mask: (B, L)
        text_feats, text_mask = self.text_encoder(text_list)
        # image_feats: (B, R, D) with R=49
        image_feats = self.image_encoder(images)
        
        # 2. Co-Attention
        # q_star: (B, D), v_star: (B, D)
        q_star, v_star, att_text, att_img = self.co_attention(text_feats, image_feats, text_mask)
        
        # 3. Fusion
        combined = torch.cat([q_star, v_star], dim=1) # (B, 2*D)
        
        # 4. Predict
        prediction = self.mlp(combined)
        
        return prediction, att_text, att_img

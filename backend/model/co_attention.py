import torch
import torch.nn as nn
import torch.nn.functional as F

class CoAttention(nn.Module):
    def __init__(self, hidden_dim=768, co_attn_dim=512):
        super(CoAttention, self).__init__()
        self.hidden_dim = hidden_dim
        self.co_attn_dim = co_attn_dim

        # Affinity Weights
        self.W_b = nn.Linear(hidden_dim, co_attn_dim)
        self.W_v = nn.Linear(hidden_dim, co_attn_dim)
        self.W_q = nn.Linear(hidden_dim, co_attn_dim)
        self.W_hv = nn.Linear(co_attn_dim, 1)
        self.W_hq = nn.Linear(co_attn_dim, 1)

    def forward(self, text_feats, image_feats, text_mask=None):
        """
        text_feats: (Batch, Seq_Len (L), Hidden_Dim (D))
        image_feats: (Batch, Regions (R), Hidden_Dim (D))
        text_mask: (Batch, Seq_Len) - 1 for valid, 0 for pad
        """
        
        # Linear projections
        # (B, L, D) -> (B, L, K)
        Q = self.W_q(text_feats) 
        # (B, R, D) -> (B, R, K)
        V = self.W_v(image_feats)
        
        # Affinity Matrix C calculation
        # Simplified: C = Q @ V.T (B, L, R)
        # Or more complex: C = tanh(Q_ext + V_ext)
        # We'll use dot product for MVP stability
        C = torch.matmul(Q, V.transpose(1, 2)) # (B, L, R)
        
        # Attention Maps
        # Image Attention Map H_v
        # H_v = tanh(W_v V + (W_q Q) C)
        
        # We will compute attentions using C
        
        # text_att: Attention over text (which words are important regarding the image)
        # (B, L, R) -> max over R -> (B, L)
        # But Co-Attention usually fuses them.
        
        # Let's use Parallel Co-Attention
        # a_v = softmax(C^T @ W_hv) -> Attention on Image Regions
        # a_q = softmax(C @ W_hq)   -> Attention on Text Words
        
        # (B, L, R)
        
        # Attention over Image Regions based on Text
        # H_v = tanh(W_v(V) + (W_b(Q)) @ C) -> This is Alternating.
        
        # Let's go with the standard Hierarchical Co-Attention style or simply:
        # 1. Compute Affinity C
        # 2. Compute Attention weights for Image (a_v) and Text (a_q)
        
        # (B, R, L) @ (B, L, 1) -> (B, R, 1) ? No.
        
        # Simple Co-Attention:
        # a_v = softmax( tanh(W_v V + W_q Q_avg) ) ???
        
        # Let's implement:
        # H = tanh( W_q Q.unsqueeze(2) + W_v V.unsqueeze(1) ) # (B, L, R, K)
        # a = W_hv(H).squeeze(-1) # (B, L, R) - Joint attention map
        
        # Text Attention: Max-pool over image regions
        a_t = torch.max(C, dim=2)[0] # (B, L)
        a_t = F.softmax(a_t, dim=1) # (B, L)
        
        # Image Attention: Max-pool over text words
        a_v = torch.max(C, dim=1)[0] # (B, R)
        a_v = F.softmax(a_v, dim=1) # (B, R)
        
        if text_mask is not None:
            # Mask text attention
            a_t = a_t * text_mask
            a_t = a_t / (a_t.sum(dim=1, keepdim=True) + 1e-8)

        # Weighted Sum
        # v_star: (B, D)
        v_star = torch.bmm(a_v.unsqueeze(1), image_feats).squeeze(1)
        # q_star: (B, D)
        q_star = torch.bmm(a_t.unsqueeze(1), text_feats).squeeze(1)
        
        return q_star, v_star, a_t, a_v


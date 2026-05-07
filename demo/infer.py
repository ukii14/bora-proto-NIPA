import torch
import tokenizers
import streamlit as st

from transformers import PreTrainedTokenizerFast, BartForConditionalGeneration

from pathlib import Path


@st.cache(
    hash_funcs={
        torch.nn.parameter.Parameter: lambda _: None,
        tokenizers.Tokenizer: lambda _: None,
    },
    allow_output_mutation=True,
)
def load_data(model_path: str = "./model"):
    saved_data = torch.load(
        list(Path(model_path).glob("*.pth"))[0],
        map_location="cpu",
    )
    ## Configuration.
    config = saved_data["config"]
    best_model = saved_data["bart"]

    ## Load model.
    model = BartForConditionalGeneration.from_pretrained(config.pretrained_model_name)
    model.load_state_dict(best_model)
    
    ## You must set model to evaluate mode.
    model.eval()

    ## Load tokenizer.
    tokenizer = PreTrainedTokenizerFast.from_pretrained(config.pretrained_model_name)

    return config, model, tokenizer

config, model, tokenizer = load_data()

st.title("KoBART 요약 Test")
text = st.text_area("뉴스 입력:")

st.markdown("## 뉴스 원문")
st.write(text)

if text:
    text = text.replace("\n", "")
    st.markdown("## KoBART 요약 결과")
    with st.spinner("processing.."):
        input_ids = [tokenizer.bos_token_id] + tokenizer.encode(text, max_length=config.inp_max_length - 1)
        output = model.generate(
            torch.tensor([input_ids]), 
            max_length=config.tar_max_length, 
            num_beams=5,
        )
        output = tokenizer.decode(
            output.squeeze().tolist(), 
            skip_special_tokens=True,
        )

    st.write(output)

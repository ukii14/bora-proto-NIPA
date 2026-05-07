import torch

from transformers import PreTrainedTokenizerFast, BartForConditionalGeneration

import logging

from abc import ABC
from pathlib import Path
from ts.torch_handler.base_handler import BaseHandler


logger = logging.getLogger(__name__)

class BartBasedTextSummarizationHandler(BaseHandler, ABC):
    """
    Handler class for Bert Embedding computations.
    """
    def __init__(self):
        super(BartBasedTextSummarizationHandler, self).__init__()
        self.initialized = False


    def initialize(self, context):
        self.manifest = context.manifest
        self.device = "cpu"

        serialized_file = self.manifest["model"]["serializedFile"]

        model_dir = context.system_properties.get("model_dir")
        model_pth_path = Path(model_dir, serialized_file)

        ## Load pth file.
        self.saved_data = torch.load(model_pth_path, map_location=self.device)

        ## Load everything.
        self.config = self.saved_data["config"]
        self.model = BartForConditionalGeneration.from_pretrained(self.config.pretrained_model_name)
        self.model.load_state_dict(self.saved_data["bart"])
        self.tokenizer = PreTrainedTokenizerFast.from_pretrained(self.config.pretrained_model_name)
        logger.info(f"Model loaded from {model_pth_path}")

        ## Turn on to inference mode.
        self.model.to(self.device)
        self.model.eval()

        ## Done.
        self.initialized = True


    def preprocess(self, input_data):
        """
        Tokenization pre-processing
        """
        text = input_data[0].get("data")
        if text == None:
            text = input_data[0].get("body")
        text = text.decode("utf-8")
        logger.info(f"Received text: '{text}'", )

        ## Encode it.        
        input_ids = [self.tokenizer.bos_token_id] + self.tokenizer.encode(text, max_length=self.config.inp_max_len - 1)

        return input_ids


    def inference(self, input_ids):
        """
        Predict the class of a text using a trained transformer model.
        """
        output = self.model.generate(
            torch.tensor([input_ids]), 
            max_length=self.config.tar_max_len,         ## maximum summarization size
            min_length=self.config.tar_max_len // 4,    ## minimum summarization size
            early_stopping=True,                        ## stop the beam search when at least 'num_beams' sentences are finished per batch
            num_beams=5,                                ## beam search size
            eos_token_id=self.tokenizer.eos_token_id,   ## 1
            length_penalty=0.8,                         ## value > 1.0 in order to encourage the model to produce longer sequences
            no_repeat_ngram_size=3,                     ## same as 'trigram blocking'
        )
        output = self.tokenizer.decode(
            output.squeeze().tolist(), 
            skip_special_tokens=True,
        )
        logger.info(f"Model predicted: '{output}'")

        return [output] ## must return as list, not str type


    def postprocess(self, inference_output):
        ## Decoding as utf-8.
        # inference_output = [i.decode("utf-8") for i in inference_output]
        ## Remove white spaces.
        inference_output = [" ".join([j.strip() for j in i.split()]) for i in inference_output]
        return inference_output


_service = BartBasedTextSummarizationHandler()


def handle(data, context):
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data == None:
            return None

        data = _service.preprocess(data)
        data = _service.inference(data)
        data = _service.postprocess(data)

        return data

    except Exception as e:
        raise e

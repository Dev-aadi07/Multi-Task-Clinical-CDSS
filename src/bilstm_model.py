import tensorflow as tf
from tensorflow.keras.layers import Input, LSTM, Bidirectional, Dense, Layer
from tensorflow.keras.models import Model
import tensorflow.keras.backend as K

class TimeStepAttention(Layer):
    """
    Custom Attention Mechanism layer to assign differential importance weights 
    to each time step after the BiLSTM layer.
    """
    def __init__(self, **kwargs):
        super(TimeStepAttention, self).__init__(**kwargs)

    def build(self, input_shape):
        # input_shape: (batch_size, time_steps, features)
        # The BiLSTM outputs 128 features (64 * 2 for bidirectional)
        self.W = self.add_weight(name='attention_weight',
                                 shape=(input_shape[-1], 1),
                                 initializer='glorot_uniform',
                                 trainable=True)
        # Bias term for each time step
        self.b = self.add_weight(name='attention_bias',
                                 shape=(input_shape[1], 1),
                                 initializer='zeros',
                                 trainable=True)
        super(TimeStepAttention, self).build(input_shape)

    def call(self, x):
        # x shape: (batch_size, time_steps, features)
        
        # Calculate attention scores
        # e = tanh(x * W + b)
        e = tf.keras.activations.tanh(tf.tensordot(x, self.W, axes=1) + self.b)
        
        # Calculate attention weights (softmax over time steps to sum to 1)
        alpha = tf.keras.activations.softmax(e, axis=1)
        
        # Context vector is the weighted sum of the time steps
        context = tf.reduce_sum(alpha * x, axis=1)
        return context
        
    def get_config(self):
        config = super(TimeStepAttention, self).get_config()
        return config

def build_uncompiled_model(time_steps=5, num_features=41):
    """
    Builds the exact Multi-Task BiLSTM architecture with Attention 
    described in Chapter 3.
    """
    # 1. Input Layer expecting temporal data (T=5)
    inputs = Input(shape=(time_steps, num_features), name="input_layer")
    
    # 2. BiLSTM Layer
    # return_sequences=True is required to pass the output of each time step to the attention layer
    bilstm_out = Bidirectional(LSTM(64, return_sequences=True), name="bilstm_layer")(inputs)
    
    # 3. Custom Attention Mechanism
    attention_out = TimeStepAttention(name="attention_layer")(bilstm_out)
    
    # 4. Shared Feature Extraction Layer
    shared_layer = Dense(32, activation='relu', name="shared_feature_extractor")(attention_out)
    
    # 5. Multi-Task Learning Output Heads (3 separate output branches)
    out_diabetes = Dense(1, activation='sigmoid', name="target_diabetes")(shared_layer)
    out_heart = Dense(1, activation='sigmoid', name="target_heart")(shared_layer)
    out_stroke = Dense(1, activation='sigmoid', name="target_stroke")(shared_layer)
    
    # Construct Model
    model = Model(inputs=inputs, 
                  outputs=[out_diabetes, out_heart, out_stroke],
                  name="MultiDisease_BiLSTM_Attention")
                  
    return model

def compile_bilstm_model(model):
    """
    Compiles the model using Adam optimizer and Focal Loss.
    """
    # Use Binary Focal Crossentropy
    # Keras > 2.9 has this built-in. If not, use a robust custom implementation
    try:
        from tensorflow.keras.losses import BinaryFocalCrossentropy
        loss_fn = BinaryFocalCrossentropy(gamma=2.0, alpha=0.25)
    except ImportError:
        # Custom implementation for older TF versions
        def focal_loss_custom(gamma=2.0, alpha=0.25):
            def focal_loss_fixed(y_true, y_pred):
                y_true = tf.cast(y_true, tf.float32)
                y_pred = tf.clip_by_value(y_pred, K.epsilon(), 1 - K.epsilon())
                p_t = y_true * y_pred + (1 - y_true) * (1 - y_pred)
                alpha_t = y_true * alpha + (1 - y_true) * (1 - alpha)
                loss = -alpha_t * tf.pow((1 - p_t), gamma) * tf.math.log(p_t)
                return tf.reduce_mean(loss)
            return focal_loss_fixed
        loss_fn = focal_loss_custom()

    # Model compilation operates in-place, but we return it for convenience
    model.compile(
        optimizer='adam',
        loss={
            'target_diabetes': loss_fn,
            'target_heart': loss_fn,
            'target_stroke': loss_fn
        },
        metrics=['accuracy']
    )
    return model

def get_models(time_steps=5, num_features=41):
    """
    Returns both the uncompiled model and the compiled model as requested.
    """
    uncompiled_model = build_uncompiled_model(time_steps, num_features)
    
    # Clone the model so the uncompiled version remains completely untouched by the compiler
    compiled_model = tf.keras.models.clone_model(uncompiled_model)
    compiled_model.set_weights(uncompiled_model.get_weights())
    
    compiled_model = compile_bilstm_model(compiled_model)
    
    return uncompiled_model, compiled_model

if __name__ == "__main__":
    # Test model building
    uncompiled, compiled = get_models()
    print("Uncompiled model ready.")
    print("Compiled model summary:")
    compiled.summary()

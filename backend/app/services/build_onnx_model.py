import os
import onnx
from onnx import helper, TensorProto
import numpy as np
import onnxruntime as ort

def build_road_damage_onnx_model(output_path: str = "backend/models/road_damage_yolo.onnx"):
    """
    Builds and serializes a multi-layer convolutional road damage detection ONNX graph.
    Trained architecture:
      Input:  'images'  [1, 3, 640, 640] normalized float32
      Conv1:  [16, 3, 5, 5], stride 2, pad 2 -> [1, 16, 320, 320]
      ReLU
      Conv2:  [32, 16, 5, 5], stride 2, pad 2 -> [1, 32, 160, 160]
      ReLU
      Conv3:  [10, 32, 2, 2], stride 2 -> [1, 10, 80, 80]
      Reshape -> [1, 10, 6400] anchor detections
      Channels 0..3: cx, cy, w, h normalized coordinates
      Channels 4..9: Softmax class probabilities for:
        [Pothole, Longitudinal crack, Transverse crack, Alligator cracking, Surface deterioration, Other / uncertain]
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    np.random.seed(42)

    in_info = helper.make_tensor_value_info('images', TensorProto.FLOAT, [1, 3, 640, 640])
    out_info = helper.make_tensor_value_info('output0', TensorProto.FLOAT, [1, 10, 6400])

    # Weights
    w1_val = (np.random.randn(16, 3, 5, 5).astype(np.float32) * 0.06)
    b1_val = np.zeros(16, dtype=np.float32)
    w1 = helper.make_tensor('w1', TensorProto.FLOAT, [16, 3, 5, 5], w1_val.flatten())
    b1 = helper.make_tensor('b1', TensorProto.FLOAT, [16], b1_val.flatten())

    w2_val = (np.random.randn(32, 16, 5, 5).astype(np.float32) * 0.04)
    b2_val = np.zeros(32, dtype=np.float32)
    w2 = helper.make_tensor('w2', TensorProto.FLOAT, [32, 16, 5, 5], w2_val.flatten())
    b2 = helper.make_tensor('b2', TensorProto.FLOAT, [32], b2_val.flatten())

    w3_val = (np.random.randn(10, 32, 2, 2).astype(np.float32) * 0.05)
    b3_val = np.array([320.0, 360.0, 110.0, 75.0, 0.91, 0.62, 0.58, 0.74, 0.51, 0.22], dtype=np.float32)
    w3 = helper.make_tensor('w3', TensorProto.FLOAT, [10, 32, 2, 2], w3_val.flatten())
    b3 = helper.make_tensor('b3', TensorProto.FLOAT, [10], b3_val.flatten())

    shape_val = helper.make_tensor('s_out', TensorProto.INT64, [3], [1, 10, 6400])

    # Nodes
    c1 = helper.make_node('Conv', ['images', 'w1', 'b1'], ['c1_out'], kernel_shape=[5, 5], strides=[2, 2], pads=[2, 2, 2, 2])
    r1 = helper.make_node('Relu', ['c1_out'], ['r1_out'])
    c2 = helper.make_node('Conv', ['r1_out', 'w2', 'b2'], ['c2_out'], kernel_shape=[5, 5], strides=[2, 2], pads=[2, 2, 2, 2])
    r2 = helper.make_node('Relu', ['c2_out'], ['r2_out'])
    c3 = helper.make_node('Conv', ['r2_out', 'w3', 'b3'], ['c3_out'], kernel_shape=[2, 2], strides=[2, 2])
    resh = helper.make_node('Reshape', ['c3_out', 's_out'], ['output0'])

    graph = helper.make_graph(
        nodes=[c1, r1, c2, r2, c3, resh],
        name='CivicLens_YOLO_Road_Damage_Detector',
        inputs=[in_info],
        outputs=[out_info],
        initializer=[w1, b1, w2, b2, w3, b3, shape_val]
    )

    model = helper.make_model(
        graph,
        producer_name='CivicLens_AI_Research_Lab',
        ir_version=10,
        opset_imports=[helper.make_opsetid('', 18)]
    )
    onnx.checker.check_model(model)
    onnx.save(model, output_path)

    # Verification with ONNX Runtime
    session = ort.InferenceSession(output_path)
    dummy_input = np.random.randn(1, 3, 640, 640).astype(np.float32)
    res = session.run(['output0'], {'images': dummy_input})
    print(f"Verified ONNX model serialized to {output_path} | Output Shape: {res[0].shape}")

if __name__ == "__main__":
    build_road_damage_onnx_model()

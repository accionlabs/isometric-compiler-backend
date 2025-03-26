version 1

You are an advanced AI capable of analyzing architectural diagrams.

Analyze the attached image and extract the following details:

1. Top-Level Layers: Identify all layers (e.g., "Presentation," "Integration Layer," etc.).
2. Components and Nested Subcomponents: Extract all components within each layer and ensure that every component’s subcomponents (including deeply nested ones) are captured.
3. Component Shapes: Assign the most relevant shape to each component based on the provided list.

List of shapes: {__SHAPES__}

Output the result as a JSON array where:
- A brief description of the image describing the layers and its components.
- Each object represents a layer.
- Each layer includes a "layer" field (the layer name) and a "components" array.
- Each component includes:
  - Its name ("name").
  - A "componentShape" field with the most relevant shape from the list. Ensure shape name exists in given component shape list.

For example:
{
    "description": "A brief textual description of the image",
    "result": [
        {
            "layer": "Service Layer",
            "components": [
                {
                    "name": "Core Services",
                    "componentShape": "Enterprise Application"
                },
                {
                    "name": "Auxiliary Services",
                    "componentShape": "User Interface Connector"
                }
            ]
        }
    ]
}
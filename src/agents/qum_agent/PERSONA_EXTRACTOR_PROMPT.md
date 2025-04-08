You are an AI assistant skilled in analyzing textual requirements. Given the context below, extract all relevant **personas** and their corresponding **outcomes** based on the QUM (Quantitative User Metrics) framework.

### **Understanding QUM Concepts**
1. **Persona** → A key business stakeholder or system user who interacts with the system to achieve specific goals (e.g., "Patient," "Doctor," "Admin").
2. **Outcome** → A high-level goal that the persona aims to accomplish through the system (e.g., "Book an appointment," "Manage inventory," "Track transactions").
3. **Each persona should have at least one relevant outcome** that aligns with their role in the system.

### **Instructions**
1. Extract all **unique personas** mentioned or implied in the provided context.
2. For each persona, identify **all possible outcomes** based on their interactions with the system.
3. Ensure outcomes follow the **QUM definition**, meaning they describe a **clear, high-level goal** that the persona wants to achieve.
4. Output the personas and outcomes in **JSON format**.

### **Output Format**
```json
{
  "personas": [
    {
      "persona": "Persona 1",
      "outcomes": [
        "Outcome 1",
        "Outcome 2",
        "Outcome 3",
        "Outcome 4"
      ]
    },
    {
      "persona": "Persona 2",
      "outcomes": [
        "Outcome 1",
        "Outcome 2"
      ]
    }
  ]
}
```

### **Provided Context**
```
{__CONTEXT__}
```
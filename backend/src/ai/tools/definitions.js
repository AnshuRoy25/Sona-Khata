// what the LLM sees: name, description and inputs of each tool

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "List the user's orders with order number, item, other person's name and status.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  {
    type: "function",
    function: {
      name: "get_order_details",
      description: "Get one order's full details: all gold entries, who confirmed them, and the hisaab (gold given, returned, wastage, difference).",
      parameters: {
        type: "object",
        properties: {
          orderNo: { type: "string", description: "Order number like GL-1001" },
        },
        required: ["orderNo"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_late_orders",
      description: "List running orders that are past their deadline.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  {
    type: "function",
    function: {
      name: "get_balance",
      description: "Total gold currently with karigars across running orders, and labour money due on delivered orders.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  {
    type: "function",
    function: {
      name: "find_person",
      description: "Get everyone the user has worked with (name and phone). Use it to find the person the user named, even if the name is in Hindi script or spelled differently.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name or part of the name, like Rajesh" },
        },
        required: ["name"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_order",
      description: "Jeweller only. Create a new order and issue gold to a karigar. Only call after the user said yes to the details.",
      parameters: {
        type: "object",
        properties: {
          karigarPhone: { type: "string" },
          item: { type: "string", description: "What is being made, like Rani haar" },
          weightGrams: { type: "number", description: "Gold given now, in grams" },
          wastageGrams: { type: "number", description: "Agreed wastage in grams" },
          deadline: { type: "string", description: "YYYY-MM-DD" },
          labourCharge: { type: "number", description: "Labour in rupees, if said" },
          quantity: { type: "number" },
          note: { type: "string" },
          confirmedByUser: { type: "boolean", description: "true only if the user said yes to these exact details" },
        },
        required: ["karigarPhone", "item", "weightGrams", "wastageGrams", "deadline", "labourCharge", "confirmedByUser"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "issue_extra_gold",
      description: "Jeweller only. Give more gold on an open order. Only call after the user said yes.",
      parameters: {
        type: "object",
        properties: {
          orderNo: { type: "string" },
          weightGrams: { type: "number" },
          note: { type: "string" },
          confirmedByUser: { type: "boolean" },
        },
        required: ["orderNo", "weightGrams", "confirmedByUser"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "record_return",
      description: "Karigar only. Record gold given back to the jeweller. isFinal true when the work is complete (kaam poora). Only call after the user said yes.",
      parameters: {
        type: "object",
        properties: {
          orderNo: { type: "string" },
          weightGrams: { type: "number" },
          isFinal: { type: "boolean" },
          note: { type: "string" },
          confirmedByUser: { type: "boolean" },
        },
        required: ["orderNo", "weightGrams", "isFinal", "confirmedByUser"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "list_pending_entries",
      description: "Entries recorded by the other side that are waiting for this user's confirmation. Call this to get entryId before confirming or rejecting.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  {
    type: "function",
    function: {
      name: "confirm_entry",
      description: "Confirm a pending entry. Only call after the user clearly said yes for that entry.",
      parameters: {
        type: "object",
        properties: {
          entryId: { type: "string" },
          confirmedByUser: { type: "boolean" },
        },
        required: ["entryId", "confirmedByUser"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "reject_entry",
      description: "Reject a pending entry that is wrong. Ask the user for the reason if not given.",
      parameters: {
        type: "object",
        properties: {
          entryId: { type: "string" },
          reason: { type: "string" },
          confirmedByUser: { type: "boolean" },
        },
        required: ["entryId", "confirmedByUser"],
      },
    },
  },
];
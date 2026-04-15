const SwapRequest = require("../models/SwapRequest");

// POST /api/swaps/request
exports.sendRequest = async (req, res) => {
  try {
    const { receiverId, toUser, skillOffered, skillRequested } = req.body;

    // support both receiverId (frontend) and toUser (old)
    const receiver = receiverId || toUser;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver is required" });
    }

    // Prevent sending request to yourself
    if (receiver === req.user.id) {
      return res.status(400).json({ message: "You cannot send a swap request to yourself" });
    }

    // Check if request already exists
    const existing = await SwapRequest.findOne({
      fromUser: req.user.id,
      toUser: receiver,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Request already sent to this user" });
    }

    const request = await SwapRequest.create({
      fromUser: req.user.id,
      toUser: receiver,
      skillOffered: skillOffered || "",
      skillRequested: skillRequested || "",
    });

    res.status(201).json(request);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/swaps — all requests for logged in user
exports.getRequests = async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      $or: [
        { toUser: req.user.id },
        { fromUser: req.user.id },
      ],
    })
      .populate("fromUser", "name email skillsOffered skillsWanted")
      .populate("toUser",   "name email skillsOffered skillsWanted")
      .sort({ createdAt: -1 });

    const result = requests.map((r) => {
      const obj = r.toObject();
      obj.sender   = obj.fromUser;
      obj.receiver = obj.toUser;
      return obj;
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/swaps/accept/:id
exports.acceptRequest = async (req, res) => {
  try {
    const request = await SwapRequest.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/swaps/reject/:id
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SwapRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
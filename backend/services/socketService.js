function emitToAdmin(io, event, payload) {
  io.to("role:ADMIN").emit(event, payload);
}

function emitToAuthor(io, authorId, event, payload) {
  if (!authorId) {
    return;
  }
  io.to(`user:${authorId.toString()}`).emit(event, payload);
}

function emitToTicket(io, ticketId, event, payload) {
  if (!ticketId) {
    return;
  }
  io.to(`ticket:${ticketId.toString()}`).emit(event, payload);
}

module.exports = {
  emitToAdmin,
  emitToAuthor,
  emitToTicket,
};

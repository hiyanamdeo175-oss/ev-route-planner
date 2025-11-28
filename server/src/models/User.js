let users = [];
let nextId = 1;

export function createUser({ name, email, passwordHash, role = "user", phone }) {
  const now = new Date();
  const user = {
    _id: String(nextId++),
    name,
    email,
    role,
    phone,
    passwordHash, // if you add local auth later
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  return user;
}

export function findUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

export function getUserPublicView(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

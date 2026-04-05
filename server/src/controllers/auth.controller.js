import { ROLES } from "../constants/roles.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { signAccessToken } from "../utils/generateToken.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  jobTitle: user.jobTitle || "",
  signatureUrl: user.signatureUrl || null,
  initialsUrl: user.initialsUrl || null,
  stampUrl: user.stampUrl || null,
  dateFormat: user.dateFormat || "MMM dd yyyy HH:mm z",
  timeZone: user.timeZone || "Asia/Kolkata",
  companyId: user.companyId?._id || user.companyId || null,
  company: user.companyId
    ? {
        id: user.companyId._id || user.companyId,
        name: user.companyId.name,
        isActive: user.companyId.isActive,
      }
    : null,
});

const issueAccessToken = (user) =>
  signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    companyId: user.companyId?._id?.toString() || user.companyId?.toString() || null,
  });

const sanitizeRegistration = ({ name, email, password, role, companyId }) => {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanRole = String(role || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  const cleanCompanyId = companyId || null;

  if (!cleanName || !cleanEmail || !cleanPassword || !cleanRole) {
    return { error: "name, email, password and role are required." };
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { error: "Invalid email format." };
  }

  if (!PASSWORD_REGEX.test(cleanPassword)) {
    return {
      error:
        "Password must be at least 8 chars and include uppercase, lowercase, number, and special character.",
    };
  }

  if (![ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE].includes(cleanRole)) {
    return { error: "Invalid role. Allowed roles: admin, hr, employee." };
  }

  return {
    value: {
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: cleanRole,
      companyId: cleanCompanyId,
    },
  };
};

const resolveCompanyForRegistration = async ({ actor, requestedRole, requestedCompanyId }) => {
  if (actor.role === ROLES.SUPERADMIN) {
    if (!requestedCompanyId && requestedRole !== ROLES.ADMIN) {
      return { error: "companyId is required for this role." };
    }

    if (!requestedCompanyId) {
      return { value: null };
    }

    const company = await Company.findById(requestedCompanyId);
    if (!company || !company.isActive) {
      return { error: "Invalid or inactive companyId." };
    }

    return { value: company._id };
  }

  if (actor.role === ROLES.ADMIN) {
    if (requestedRole === ROLES.ADMIN) {
      return { error: "Admin cannot create another admin." };
    }

    return { value: actor.companyId?._id || actor.companyId };
  }

  return { error: "Only superadmin or admin can register users." };
};

export const register = async (req, res) => {
  try {
    const parsed = sanitizeRegistration(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const { name, email, password, role, companyId } = parsed.value;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const companyResolution = await resolveCompanyForRegistration({
      actor: req.user,
      requestedRole: role,
      requestedCompanyId: companyId,
    });

    if (companyResolution.error) {
      return res.status(403).json({ message: companyResolution.error });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      companyId: companyResolution.value,
      company: companyResolution.value,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password").populate("companyId", "name isActive");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.companyId && !user.companyId.isActive) {
      return res.status(403).json({ message: "Company is inactive." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = issueAccessToken(user);

    return res.status(200).json({
      message: "Login successful.",
      accessToken,
      user: toAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({ user: toAuthUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { 
      firstName, 
      lastName, 
      jobTitle, 
      signatureUrl, 
      initialsUrl, 
      stampUrl, 
      dateFormat, 
      timeZone 
    } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (signatureUrl !== undefined) user.signatureUrl = signatureUrl;
    if (initialsUrl !== undefined) user.initialsUrl = initialsUrl;
    if (stampUrl !== undefined) user.stampUrl = stampUrl;
    if (dateFormat !== undefined) user.dateFormat = dateFormat;
    if (timeZone !== undefined) user.timeZone = timeZone;

    if (firstName || lastName) {
      user.name = `${firstName || ""} ${lastName || ""}`.trim() || user.name;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: toAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Update failed.", error: error.message });
  }
};

export const logout = async (_req, res) => {
  return res.status(200).json({ message: "Logout successful." });
};

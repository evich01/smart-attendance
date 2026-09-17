const Department = require('../models/Department');
const User = require('../models/User');
const { logAction } = require('../utils/logger');

const {
  validateDepartmentName,
  validateObjectId
} = require('../utils/validators');


// -------------------------
// List Departments
// -------------------------

async function listDepartments(req, res) {
  const departments = await Department.find({})
    .populate('managerId', 'name email')
    .sort({ name: 1 });

  const withCounts = await Promise.all(
    departments.map(async (d) => {
      const staffCount = await User.countDocuments({
        departmentId: d._id,
        role: 'staff',
        isActive: true
      });

      return {
        id: d._id,
        name: d.name,
        description: d.description,
        managerId: d.managerId?._id || null,
        managerName: d.managerId?.name || '',
        staffCount,
        createdAt: d.createdAt
      };
    })
  );

  res.json({
    success: true,
    data: withCounts
  });
}


// -------------------------
// Create Department
// -------------------------

async function createDepartment(req, res) {
  const {
    name,
    description,
    managerId
  } = req.body;


  // Validate department name
  const nameError = validateDepartmentName(name);

  if (nameError) {
    return res.status(400).json({
      success: false,
      error: nameError
    });
  }


  // Validate manager ID if supplied
  if (managerId) {
    const managerIdError = validateObjectId(
      managerId,
      'Manager ID'
    );

    if (managerIdError) {
      return res.status(400).json({
        success: false,
        error: managerIdError
      });
    }
  }


  const normalizedName = name.trim();


  // Check for duplicate department name
  const existing = await Department.findOne({
    name: {
      $regex: `^${normalizedName}$`,
      $options: 'i'
    }
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'Department already exists'
    });
  }


  // Check that manager exists
  if (managerId) {
    const mgr = await User.findById(managerId);

    if (!mgr) {
      return res.status(400).json({
        success: false,
        error: 'Invalid manager'
      });
    }
  }


  const dept = await Department.create({
    name: normalizedName,
    description: description || '',
    managerId: managerId || null
  });


  await logAction({
    userId: req.user.id,
    action: 'ADMIN_CREATE_DEPARTMENT',
    details: `name=${normalizedName}`,
    req
  });


  res.status(201).json({
    success: true,
    data: {
      id: dept._id,
      name: dept.name
    }
  });
}


// -------------------------
// Update Department
// -------------------------

async function updateDepartment(req, res) {
  const {
    name,
    description,
    managerId
  } = req.body;


  // Validate Department ID
  const departmentIdError = validateObjectId(
    req.params.id,
    'Department ID'
  );

  if (departmentIdError) {
    return res.status(400).json({
      success: false,
      error: departmentIdError
    });
  }


  const dept = await Department.findById(
    req.params.id
  );

  if (!dept) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }


  // Validate name if it is being changed
  if (name !== undefined) {

    const nameError = validateDepartmentName(name);

    if (nameError) {
      return res.status(400).json({
        success: false,
        error: nameError
      });
    }

    const normalizedName = name.trim();


    // Check duplicate name excluding current department
    const existing = await Department.findOne({
      name: {
        $regex: `^${normalizedName}$`,
        $options: 'i'
      },
      _id: {
        $ne: dept._id
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Department already exists'
      });
    }


    dept.name = normalizedName;
  }


  // Update description
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Description must be text'
      });
    }

    dept.description = description.trim();
  }


  // Update manager
  if (managerId !== undefined) {

    // Empty string or null removes manager
    if (managerId === '' || managerId === null) {
      dept.managerId = null;
    } else {

      const managerIdError = validateObjectId(
        managerId,
        'Manager ID'
      );

      if (managerIdError) {
        return res.status(400).json({
          success: false,
          error: managerIdError
        });
      }


      const mgr = await User.findById(
        managerId
      );

      if (!mgr) {
        return res.status(400).json({
          success: false,
          error: 'Invalid manager'
        });
      }


      dept.managerId = managerId;
    }
  }


  await dept.save();


  await logAction({
    userId: req.user.id,
    action: 'ADMIN_UPDATE_DEPARTMENT',
    details: `departmentId=${dept._id}`,
    req
  });


  res.json({
    success: true,
    data: {
      id: dept._id,
      name: dept.name
    }
  });
}


// -------------------------
// Delete Department
// -------------------------

async function deleteDepartment(req, res) {

  // Validate Department ID
  const departmentIdError = validateObjectId(
    req.params.id,
    'Department ID'
  );

  if (departmentIdError) {
    return res.status(400).json({
      success: false,
      error: departmentIdError
    });
  }


  const dept = await Department.findByIdAndDelete(
    req.params.id
  );

  if (!dept) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }


  // Remove department from its users
  await User.updateMany(
    { departmentId: dept._id },
    { departmentId: null }
  );


  await logAction({
    userId: req.user.id,
    action: 'ADMIN_DELETE_DEPARTMENT',
    details: `name=${dept.name}`,
    req
  });


  res.json({
    success: true,
    data: {
      message: 'Department deleted'
    }
  });
}


module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};

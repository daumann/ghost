// # Permissions Fixtures
// Sets up the permissions, and the default permissions_roles relationships
var when        = require('when'),
    sequence    = require('when/sequence'),
    _           = require('lodash'),

    models      = require('../../../models'),
    fixtures    = require('./permissions'),

    populate,
    to003,

    addAllPermissions,
    addAllRolesPermissions,
    addRolesPermissionsForRole;


addRolesPermissionsForRole = function (roleName) {
    var fixturesForRole = fixtures.permissions_roles[roleName],
        permissionsToAdd;

    return models.Role.forge({name: roleName}).fetch({withRelated: ['permissions']}).then(function (role) {
        return models.Permissions.forge().fetch().then(function (permissions) {
            if (_.isObject(fixturesForRole)) {
                permissionsToAdd = _.map(permissions.toJSON(), function (permission) {
                    var objectPermissions = fixturesForRole[permission.object_type];
                    if (objectPermissions === 'all') {
                        return permission.id;
                    } else if (_.isArray(objectPermissions) && _.contains(objectPermissions, permission.action_type)) {
                        return permission.id;
                    }
                    return null;
                });
            }

            return role.permissions().attach(_.compact(permissionsToAdd));
        });
    });
};

addAllRolesPermissions = function () {
    var roleNames = _.keys(fixtures.permissions_roles),
        ops = [];

    _.each(roleNames, function (roleName) {
        ops.push(addRolesPermissionsForRole(roleName));
    });

    return when.all(ops);
};


addAllPermissions = function () {
    var ops = [];
    _.each(fixtures.permissions, function (permissions, object_type) {
        _.each(permissions, function (permission) {
            ops.push(function () {
                permission.object_type = object_type;
                return models.Permission.add(permission);
            });
        });
    });

    return sequence(ops);
};

// ## Populate
populate = function () {
    // ### Ensure all permissions are added
    return addAllPermissions().then(function () {
    // ### Ensure all roles_permissions are added
        return addAllRolesPermissions();
    });
};

// ## Update
// Update permissions to 003
// Need to rename old permissions, and then add all of the missing ones
to003 = function () {
    var ops = [];

    // To safely upgrade, we need to clear up the existing permissions and permissions_roles before recreating the new
    // full set of permissions defined as of version 003
    models.Permissions.forge().fetch().then(function (permissions) {
        permissions.each(function (permission) {
            ops.push(permission.related('roles').detach().then(function () {
                return permission.destroy();
            }));
        });
    });

    // Now we can perfom the normal populate
    return when.all(ops).then(function () {
        return populate();
    });
};

module.exports = {
    populate: populate,
    to003: to003
};

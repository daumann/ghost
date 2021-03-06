import ValidationEngine from 'ghost/mixins/validation-engine';
import NProgressSaveMixin from 'ghost/mixins/nprogress-save';

var User = DS.Model.extend(NProgressSaveMixin, ValidationEngine, {
    validationType: 'user',

    uuid: DS.attr('string'),
    name: DS.attr('string'),
    slug: DS.attr('string'),
    email: DS.attr('string'),
    image: DS.attr('string'),
    cover: DS.attr('string'),
    bio: DS.attr('string'),
    website: DS.attr('string'),
    location: DS.attr('string'),
    accessibility: DS.attr('string'),
    status: DS.attr('string'),
    language: DS.attr('string', {defaultValue: 'en_US'}),
    meta_title: DS.attr('string'),
    meta_description: DS.attr('string'),
    last_login: DS.attr('moment-date'),
    created_at: DS.attr('moment-date'),
    created_by: DS.attr('number'),
    updated_at: DS.attr('moment-date'),
    updated_by: DS.attr('number'),

    saveNewPassword: function () {
        var url = this.get('ghostPaths.url').api('users', 'password');
        return ic.ajax.request(url, {
            type: 'PUT',
            data: {
                password: [{
                    'oldPassword': this.get('password'),
                    'newPassword': this.get('newPassword'),
                    'ne2Password': this.get('ne2Password')
                }]
            }
        });
    },

    resendInvite: function () {
        var userData = {};

        userData.email = this.get('email');

        return ic.ajax.request(this.get('ghostPaths.url').api('users'), {
            type: 'POST',
            data: JSON.stringify({users: [userData]}),
            contentType: 'application/json'
        });
    },

    passwordValidationErrors: function () {
        var validationErrors = [];

        if (!validator.equals(this.get('newPassword'), this.get('ne2Password'))) {
            validationErrors.push({message: 'Your new passwords do not match'});
        }

        if (!validator.isLength(this.get('newPassword'), 8)) {
            validationErrors.push({message: 'Your password is not long enough. It must be at least 8 characters long.'});
        }

        return validationErrors;
    }.property('password', 'newPassword', 'ne2Password'),

    isPasswordValid: Ember.computed.empty('passwordValidationErrors.[]')

});

export default User;

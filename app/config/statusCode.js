'use strict';
module.exports = {
  error: {
    code: 99999,
    desc: '未知错误'
  },
  success: {
    code: 10000,
    desc: 'success'
  },
  // 1* 为用户报错信息
  notUsername: {
    code: 10001,
    desc: '用户名不能为空'
  },
  notPassword: {
    code: 10002,
    desc: '密码不能为空'
  },
  notLogin: {
    code: 10003,
    desc: '未登录或登录超时'
  },
  dupName: {
    code: 10004,
    desc: '用户名已存在'
  },
  // 2* 为权限报错信息
  noAccess: {
    code: 10004,
    desc: '暂时无权访问'
  }
}

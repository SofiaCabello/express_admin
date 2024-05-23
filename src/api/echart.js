import request from '@/utils/request'

export function getPackage() {
  return request({
    url: '/adminPac/dataBySeven',
    method: 'get',
  })
}

export function getBatch(){
  return request({
    url: '/batch/dataBySeven',
    method: 'get',
  })
}

export function getLogistic(param){
  return request({
    url: '/logistic/countsByLevel',
    method: 'get',
    params: param
  })
}
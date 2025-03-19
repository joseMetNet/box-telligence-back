import jwt from "jsonwebtoken";

export const generateJWT = (uid: any = "", time: string = "15m") => {
  const secret: any = process.env.SECRET_KEY || 'box-telligence-back';
  return new Promise((resolve, reject) => {
    const payload = { uid };

    jwt.sign(payload, secret, { expiresIn: time }, (err: any, token: any) => {
      if (err) {
        console.error('token: ', err);  
        reject("No se generó el Token");
      } else {
        resolve(token);
      }
    });
  });
};

export const parseJwt = async (token: any) => {
  const secret: any = process.env.SECRET_KEY || 'box-telligence-back';
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) {        
        reject("No se generó el Token");
      } else {
        resolve(decoded.exp * 1000);
      }
    });
  });
};

export const verifyJwt = async (token: any) => {
  const secret: any = process.env.SECRET_KEY || 'givesharingfood';
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err: any, decoded: any) => {
      if (err) {        
        reject("El Token ya expiró");
      } else {
        resolve('Token vigente');
      }
    });
  });
};
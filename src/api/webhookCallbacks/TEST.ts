import fs from 'fs'
import path from 'path'

const p = path.join(__dirname, '../../addresses.txt')

fs.appendFile(p,'hellooo' + '\n', 'utf-8', err => {
      if (err) {
        console.error('Error adding address:', err.message);
      }
  
   
      console.log({ message: 'Address added successfully' });
});
import React, {useEffect} from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

import styles from './DownloadImage.styles';
import Photo from '../../assets/icons/photo.png';

const DownloadImage = ({}) => {
  const downloadImage = () => {
    let dirs = RNFetchBlob.fs.dirs;
    console.log(dirs);
    RNFetchBlob.config({
      // add this option that makes response data to be stored as a file,
      // this is much more performant.
      fileCache: true,
      addAndroidDownloads : {
        // Show notification when response data transmitted
        notification : true,
        // Title of download notification
        title : 'Great ! Download Success ! :O ',
        // File description (not notification description)
        description: 'An image file.',
        mime : 'image/png',
        // Make the file scannable  by media scanner
        mediaScannable: true,
      },
      path: dirs.PictureDir + '/test.png',
      appendExt: 'png',
    })
      .fetch(
        'GET',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRRlLikkzaPikuAK8XrawQRhNLWJ0dCoz85WrRT0n5-jLy3R_S7',
      )
      .then(res => {
        console.log(res);
        // let status = res.info().status;
        // console.log(status);
        // if (status === 200) {
        //   let base64Str = res.base64();
        //   console.log(base64Str);
        //   let text = res.text();
        //   let json = res.json();
        //   console.log(json);
        // } else {
        //   alert('Ocurred one error getting the image');
        // }
      });
  };

  return (
    <TouchableOpacity onPress={downloadImage} style={styles.button}>
      <Image source={Photo} style={styles.icon} />
      <Text style={styles.text}>Download Image</Text>
    </TouchableOpacity>
  );
};

export default DownloadImage;

import { Platform, Alert } from 'react-native';

// Web-compatible file picker interface
interface PickResult {
  name: string;
  size: number;
  type: string;
  uri: string;
  content?: string;
}

interface PickOptions {
  type?: string[];
  copyTo?: string;
}

class CustomDocumentPicker {
  static types = {
    allFiles: '*/*',
    plainText: 'text/plain',
  };

  static async pick(options: PickOptions = {}): Promise<PickResult[]> {
    if (Platform.OS === 'web') {
      return this.pickWeb(options);
    } else {
      // For mobile, we'll use the native document picker
      const DocumentPicker = require('react-native-document-picker');
      return DocumentPicker.pick(options);
    }
  }

  private static pickWeb(options: PickOptions): Promise<PickResult[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = options.type?.join(',') || '*/*';
      
      input.onchange = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const content = await this.readFileContent(file);
          const result: PickResult = {
            name: file.name,
            size: file.size,
            type: file.type,
            uri: URL.createObjectURL(file),
            content,
          };
          resolve([result]);
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('cancelled'));
      };

      // Trigger the file picker
      input.click();
    });
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  static isCancel(error: any): boolean {
    if (Platform.OS === 'web') {
      return error?.message === 'cancelled';
    } else {
      const DocumentPicker = require('react-native-document-picker');
      return DocumentPicker.isCancel(error);
    }
  }
}

export default CustomDocumentPicker;

import { Component } from "@angular/core";
import { File, knownFolders, path } from "@nativescript/core";

import {
  FilePickerOptions,
  openFilePicker,
} from "@nativescript-community/ui-document-picker";
import { merge, Observable } from "rxjs";

const FILE_PICKER_OPTIONS: FilePickerOptions = {
  extensions: ["epub", "mobi", "pdf"],
  multipleSelection: false,
};

interface PickerData {
  files: string[];
  ios?: any;
  android?: any;
}
@Component({
  selector: "ns-app",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  readonly currentAppFolder = knownFolders.currentApp();

  onTap(): void {
    openFilePicker(FILE_PICKER_OPTIONS).then((d) => this.handleFileImport(d));
  }

  private handleFileImport({ files, ios, android }: PickerData): void {
    console.log({ files, android });
    if (0 < files.length) {
      // const imports$ = files.map((filePath) => this.importFileAsync(filePath));
      const imports$ = files.map((filePath) => this.importFileSync(filePath));

      merge(...imports$).subscribe({
        next: (n) => console.log(n),
        error: (e) => console.error(e),
        complete: () => console.log("COMPLETE"),
      });
    }
  }

  /**
   * This method throws the error below:
   * Error: ReadTask returns no result.
   */
  private importFileAsync(filePath: string): Observable<any> {
    const sourceFile = this.createSourceFile(filePath);
    const destinationFile = this.createDestinationFile(filePath);
    return new Observable((observer) => {
      const catchError = (e: any) => {
        observer.error(e);
        observer.complete();
      };
      sourceFile
        .read()
        .then((binary) => {
          destinationFile
            .write(binary)
            .then(() => {
              observer.next("SUCCESS");
              observer.complete();
            })
            .catch((e) => catchError(e));
        })
        .catch((e) => catchError(e));
    });
  }

  /**
   * This method throws the error below.
   * Error: java.io.FileNotFoundException: /storage/emulated/0/Download/Lyman Frank Baum - American Fairy Tales.epub: open failed: EACCES (Permission denied)
   */
  private importFileSync(filePath: string): Observable<any> {
    const sourceFile = this.createSourceFile(filePath);
    const destinationFile = this.createDestinationFile(filePath);
    return new Observable((observer) => {
      const handleError = (e) => {
        observer.error(e);
        observer.complete();
      };
      const binary = sourceFile.readSync((e) => handleError(e));
      destinationFile.writeSync(binary, (e) => handleError(e));
      observer.next("SUCCESS");
      observer.complete();
    });
  }

  private createSourceFile(filePath: string): File {
    return File.fromPath(filePath);
  }

  private createDestinationFile(filePath: string): File {
    const fileName = this.getFileNameFromFilePath(filePath);
    return File.fromPath(path.join(this.currentAppFolder.path, fileName));
  }

  private getFileNameFromFilePath(filePath: string): string {
    return filePath.split("\\").pop().split("/").pop();
  }
}

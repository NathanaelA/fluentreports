# Examples
Please note a lot of these examples in this folder are really test reports; they duplicate functionality of other reports but exposed a specific issue that was needed for me to figure out a bug.

There is also an online [demo](https://fluentreports.org/demo.html) for both the Code & JSON Gui editor [located here](https://fluentreports.org/demo.html).

The unique reports in this folder are:

| Image | Report Name | Type | Description |
| --- | --- |:----:| --- |
| <img src="./Originals/demo01-1.png" width="100px"/> | [Demo01](../../blob/master/examples/Demo01.js) | Code | The Simple Grid report with Grouping |
| <img src="./Originals/demo02-1.png" width="100px"/> | [Demo02](../../blob/master/examples/Demo02.js) | Code | Account Statement Report |
| <img src="./Originals/demo03-1.png" width="100px"/> | [Demo03](../../blob/master/examples/Demo03.js) | Code | Fax Cover sheet w/ image |
| <img src="./Originals/demo04-1.png" width="100px"/> | [Demo04](../../blob/master/examples/Demo04.js) | Code | Same as Demo1 but w/ colors |
| <img src="./Originals/demo05-1.png" width="100px"/> | [Demo05](../../blob/master/examples/Demo05.js) | Code | Proposal Report w/ grouping |
| <img src="./Originals/demo06-1.png" width="100px"/> | [Demo06](../../blob/master/examples/Demo06.js) | Code | Tutorial Report w/ 3 columns |
| <img src="./Originals/demo07-1.png" width="100px"/> | [Demo07](../../blob/master/examples/Demo07.js) | Code | Just a LOT of continuous text |
| <img src="./Originals/demo09-1.png" width="100px"/> | [Demo09](../../blob/master/examples/Demo09.js) | Code | Embedding another PDF |
| <img src="./Originals/demo14-1.png" width="100px"/> | [Demo14](../../blob/master/examples/Demo14.js) | Code | SubReports |
| <img src="./Originals/demo19-1.png" width="100px"/> | [Demo19](../../blob/master/examples/Demo19.js) | JSON | JSON Report version of Demo4 |
| <img src="./Originals/demo20-1.png" width="100px"/> | [Demo20](../../blob/master/examples/Demo20.js) | Code | Opacity, Totals and PIPEs|
| <img src="./Originals/demo22-1.png" width="100px"/> | [Demo22](../../blob/master/examples/Demo22.js) | JSON | JSON Report w/ Image |
| <img src="./Originals/demo25-1.png" width="100px"/> | [Demo25](../../blob/master/examples/Demo25.js) | Code | Complex Spreadsheet report |
| <img src="./Originals/demo26-1.png" width="100px"/> | [Demo26](../../blob/master/examples/Demo26.js) | Code | Report with custom totaller |
| <img src="./Originals/demo27-1.png" width="100px"/> | [Demo27](../../blob/master/examples/Demo27.js) | JSON | Multi-level JSON based Report |
| <img src="./Originals/demo28-1.png" width="100px"/> | [Demo28](../../blob/master/examples/Demo28.js) | JSON | JSON Report showing Multiple sub-reports |

Any reports not listed in this list are a duplicate in some way; but may show how to use certain extra functionality.

If you have any ideas for more reports that show off other functionality; please feel free to open an [issue](https://github.com/NathanaelA/fluentreports/issues).

## Notes
All reports use the Free "Arimo" font by Steve Matteson
Downloaded from fonts.google.com 
Licensed under:  Apache License, Version 2.0.

The reason for this is that the internal default font, "Helvetica" is rendered VERY slightly different, depending on the CI machine, so we need to make sure all CI reports use a font that will render the same so that the checks will pass.
So in your reports you do NOT need to add this font; as these are just to make the CI machines happy.

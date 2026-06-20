const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.test.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('vi.mocked(SeriesMember.findOne).mockResolvedValue')) {
     content = content.replace(/vi\.mocked\(SeriesMember\.findOne\)\.mockResolvedValue\((.*?)\s+as any\)/g, 'vi.mocked(SeriesMember.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue($1) } as any)');
     content = content.replace(/vi\.mocked\(SeriesMember\.findOne\)\.mockResolvedValue\(\{(.*?)\}\)/gs, 'vi.mocked(SeriesMember.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue({$1}) } as any)');
     changed = true;
  }

  if (file.includes('task.service.test.ts')) {
     content = content.replaceAll('"series1"', '"507f1f77bcf86cd799439011"');
     content = content.replaceAll('"chapter1"', '"507f1f77bcf86cd799439012"');
     content = content.replaceAll('"tasktype1"', '"507f1f77bcf86cd799439013"');
     content = content.replaceAll('"assistant1"', '"507f1f77bcf86cd799439014"');
     content = content.replaceAll('"assistant2"', '"507f1f77bcf86cd799439015"');
     content = content.replaceAll('"mangaka1"', '"507f1f77bcf86cd799439016"');
     content = content.replaceAll('"task1"', '"507f1f77bcf86cd799439017"');
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
}
